'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Lock,
  QrCode,
  Tag,
  Check,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Heart,
  Upload,
  Image as ImageIcon,
  Clock,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    coverImage: string;
  };
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  book,
  onSuccess,
}: PaymentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpiCheckout, setShowUpiCheckout] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Real Money UPI QR state & Receipt Verification
  const [orderData, setOrderData] = useState<any>(null);
  const [utrInput, setUtrInput] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [authorUpiId, setAuthorUpiId] = useState(process.env.NEXT_PUBLIC_AUTHOR_UPI_ID || 'mretyunjai006@oksbi');
  const [authorName, setAuthorName] = useState('Mretyun Jai B');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setCouponInput('');
      setAppliedCoupon(null);
      setPaymentSuccess(false);
      setIsPendingApproval(false);
      setUtrInput('');
      setReceiptImage(null);
      setReceiptFileName(null);
      setShowUpiCheckout(false);

      // Fetch dynamic UPI settings set by Admin
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.authorUpiId) setAuthorUpiId(data.authorUpiId);
          if (data.authorName) setAuthorName(data.authorName);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Live Auto-Polling: checks if author approved payment from their mobile phone
  useEffect(() => {
    if (!isPendingApproval || !orderData?.orderId || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/check-status?orderId=${orderData.orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isUnlocked) {
            setPaymentSuccess(true);
            setIsPendingApproval(false);
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [isPendingApproval, orderData, paymentSuccess]);

  if (!isOpen) return null;

  const finalPayPrice = appliedCoupon ? appliedCoupon.finalPrice : book.price;

  // Step 1: Validate Coupon Code
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          bookId: book.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
        });
        setCouponError('');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Step 2: Create Real Direct Bank Transfer Order
  const handleInitiateOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          couponId: appliedCoupon?.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setError('Please sign in to unlock and purchase this book. Redirecting to sign in...');
        setTimeout(() => {
          router.push(`/auth/login?redirect=${encodeURIComponent(`/books/${book.slug}?buy=true`)}`);
        }, 1200);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.isUnlocked) {
          router.push(`/read/${book.slug}`);
          return;
        }
        setError(data.error || 'Failed to generate payment QR code.');
        setLoading(false);
        return;
      }

      setOrderData(data);
      setShowUpiCheckout(true);
    } catch (err: any) {
      setError('Network error initiating UPI payment.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Receipt Image Selection
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image size exceeds 8MB. Please select a smaller screenshot.');
      return;
    }

    setReceiptFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Step 4: Submit Payment Proof (UTR + Screenshot) for Author Approval
  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim() || utrInput.trim().length < 10) {
      setError('Please enter a valid 12-digit UPI Ref / UTR number from your payment receipt.');
      return;
    }

    if (!receiptImage) {
      setError('Please upload a screenshot of your payment receipt (GPay / PhonePe / Paytm).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/submit-payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          utrNumber: utrInput.trim(),
          receiptImage: receiptImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit payment proof.');
        setLoading(false);
        return;
      }

      setIsPendingApproval(true);
    } catch (err) {
      setError('Failed to submit payment proof. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = () => {
    onSuccess();
    router.push(`/read/${book.slug}`);
    router.refresh();
  };

  // Dynamic Real Money UPI Deep Link & QR URL
  const upiDeepLink = `upi://pay?pa=${authorUpiId}&pn=${encodeURIComponent(authorName)}&am=${finalPayPrice}&cu=INR&tn=STORYVAULT%20${book.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in font-sans">
      <div className="bg-[#0E1422]/55 backdrop-blur-3xl border border-white/[0.15] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.06] to-transparent pointer-events-none" />
        
        {/* Close Button */}
        {!paymentSuccess && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1C2638]/50 transition-all relative z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!paymentSuccess ? (
          isPendingApproval ? (
            /* STEP 3: PENDING AUTHOR APPROVAL VIEW */
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300 shadow-lg shadow-amber-500/20 animate-pulse">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                  PAYMENT RECEIPT SUBMITTED
                </span>
                <h3 className="font-serif text-2xl text-slate-100 font-bold mt-2">
                  Awaiting Author Verification
                </h3>
                <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                  We have sent an instant 1-tap approval alert to author <strong>{authorName}</strong> on mobile with your payment proof.
                </p>
              </div>

              {/* Order & Proof Summary Card */}
              <div className="bg-[#080C14] border border-[#1A2336] rounded-2xl p-4 text-left space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1E293E]">
                  <span className="text-slate-400">Book</span>
                  <span className="font-serif font-bold text-rose-200">{book.title}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1E293E]">
                  <span className="text-slate-400">Amount Paid</span>
                  <span className="font-bold text-emerald-400">₹{finalPayPrice}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#1E293E]">
                  <span className="text-slate-400">Submitted UTR</span>
                  <span className="font-mono text-slate-200">{utrInput}</span>
                </div>
                {receiptImage && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={receiptImage}
                      alt="Submitted Receipt"
                      className="w-10 h-10 object-cover rounded-lg border border-[#283652]"
                    />
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-300 block font-semibold">Payment Receipt</span>
                      Sent directly to author
                    </div>
                  </div>
                )}
              </div>

              {/* Live Polling Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 font-medium py-1">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Checking for approval in real-time...</span>
              </div>

              {/* Reassurance text */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 text-left space-y-1">
                <p className="text-slate-300 font-semibold">💡 What happens next?</p>
                <p>• If you keep this window open, your book will unlock automatically here the instant the author approves.</p>
                <p>• Need to go? You can safely close this modal anytime. You will receive an email confirmation with a direct link once approved.</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl border border-[#283652] text-slate-300 hover:text-white hover:bg-[#1C2638] font-bold text-xs transition-all cursor-pointer"
                >
                  I WILL CHECK LATER / CLOSE
                </button>
              </div>
            </div>
          ) : !showUpiCheckout ? (
            /* STEP 1: ORDER SUMMARY & COUPON INPUT */
            <>
              <div className="flex items-center gap-3 mb-6 border-b border-[#1E293E] pb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30">
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl text-rose-100 font-semibold">
                    Unlock Digital Reading Access
                  </h3>
                  <p className="text-xs text-rose-300/80">Direct Real Money Transfer • Zero Gateway Fee</p>
                </div>
              </div>

              {/* BOOK SUMMARY BANNER */}
              <div className="bg-[#080C14]/65 backdrop-blur-md rounded-2xl p-4 border border-white/[0.08] mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-md border border-white/[0.1] shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-serif text-base font-bold text-rose-200">{book.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Author: Mretyun Jai B</p>
                    <p className="text-xs text-rose-400/90 font-medium mt-1">Digital Reading Access</p>
                  </div>
                  <div className="text-right">
                    {appliedCoupon ? (
                      <div>
                        <span className="text-xs text-slate-500 line-through block">₹{book.price}</span>
                        <span className="font-serif text-xl font-bold text-emerald-400">
                          ₹{finalPayPrice}
                        </span>
                      </div>
                    ) : (
                      <span className="font-serif text-xl font-bold text-rose-300">
                        ₹{book.price}
                      </span>
                    )}
                    <p className="text-[10px] text-slate-500">Taxes Included</p>
                  </div>
                </div>
              </div>

              {/* COUPON CODE INPUT SECTION */}
              <div className="bg-[#080C14]/65 backdrop-blur-md rounded-xl p-3.5 border border-white/[0.08] mb-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Have a Promo or Coupon Code?</span>
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      id="checkout-coupon-input"
                      name="couponCode"
                      aria-label="Promo or coupon code"
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. LOVE50"
                      className="flex-1 bg-[#0E1422]/70 backdrop-blur-sm border border-white/[0.1] focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 uppercase font-mono tracking-wider focus:outline-none"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponInput.trim()}
                      className="px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {validatingCoupon ? 'APPLYING...' : 'APPLY'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Coupon &apos;{appliedCoupon.code}&apos; Applied (-₹{appliedCoupon.discountAmount})</span>
                    </div>
                    <button
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-400">{couponError}</p>
                )}
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <div className="space-y-3">
                <button
                  onClick={handleInitiateOrder}
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Generating Real UPI Payment QR...</span>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>PAY REAL MONEY VIA UPI (₹{finalPayPrice})</span>
                    </>
                  )}
                </button>
                
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    Direct Money Transfer to Author Bank Account
                  </span>
                  <span>GPay • PhonePe • Paytm</span>
                </div>
              </div>
            </>
          ) : (
            /* STEP 2: REAL MONEY DYNAMIC UPI QR & UTR VERIFICATION */
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#1E293E] pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-rose-100">
                    Real Money Transfer via UPI
                  </h3>
                  <p className="text-xs text-rose-400 font-medium">
                    Total Amount: <strong className="font-serif text-sm text-rose-200">₹{finalPayPrice}</strong>
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full font-bold">
                  DIRECT BANK TRANSFER
                </span>
              </div>

              {/* QR CODE & DEEP LINK */}
              <div className="bg-[#080C14] p-4 rounded-xl border border-[#1A2336] text-center space-y-3">
                <div className="bg-white p-2.5 rounded-xl w-44 h-44 mx-auto shadow-xl flex items-center justify-center">
                  <img src={qrCodeUrl} alt="UPI Payment QR Code" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Scan this QR code with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong> to send real money directly to author bank account.
                </p>

                <div className="pt-1">
                  <a
                    href={upiDeepLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold hover:bg-rose-500/30 transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>PAY VIA GOOGLE PAY / PHONEPE (MOBILE)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 font-mono">
                  UPI VPA: <span className="text-rose-300 font-bold">{authorUpiId}</span>
                </div>
              </div>

              {/* UTR & Receipt Screenshot Upload Form */}
              <form onSubmit={handleSubmitPaymentProof} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    1. Enter 12-Digit UPI Ref / UTR Number from Receipt
                  </label>
                  <input
                    id="upi-utr-input"
                    name="utrNumber"
                    aria-label="12-digit UPI UTR reference number"
                    type="text"
                    required
                    maxLength={12}
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 423456789012"
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl p-3 text-slate-200 font-mono tracking-widest text-center text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Check your GPay / PhonePe payment receipt for the 12-digit UPI Ref/UTR No.
                  </p>
                </div>

                {/* Screenshot Receipt Upload */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    2. Upload Payment Screenshot (GPay / PhonePe Receipt)
                  </label>
                  {!receiptImage ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#283652] hover:border-rose-500/60 rounded-xl p-4 cursor-pointer bg-[#080C14] transition-all hover:bg-rose-500/5 group">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-rose-400 mb-1 transition-colors" />
                      <span className="text-xs text-slate-300 font-semibold">Click to upload screenshot</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP (Max 8MB)</span>
                      <input
                        id="upi-receipt-file-input"
                        name="receiptFile"
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#080C14] border border-emerald-500/40 rounded-xl p-2.5">
                      <img
                        src={receiptImage}
                        alt="Receipt Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-[#283652]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-400 font-bold truncate">
                          Receipt Screenshot Attached
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {receiptFileName || 'payment_receipt.png'}
                        </p>
                      </div>
                      <label className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline px-2">
                        Change
                        <input
                          name="receiptFileChange"
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpiCheckout(false)}
                    className="flex-1 py-3 rounded-xl border border-[#283652] text-slate-300 font-bold text-xs hover:bg-[#1C2638] transition-all"
                  >
                    BACK
                  </button>

                  <button
                    type="submit"
                    disabled={loading || utrInput.length < 10 || !receiptImage}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20 hover:brightness-110 transition-all disabled:opacity-40"
                  >
                    {loading ? 'SUBMITTING PROOF...' : 'SUBMIT PROOF FOR APPROVAL'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Instant mobile notification will be dispatched to author for verification.
                </p>
              </form>
            </div>
          )
        ) : (
          /* Payment Success View */
          <div className="text-center py-4 space-y-5 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-300 shadow-lg shadow-rose-500/30">
              <CheckCircle2 className="w-10 h-10 text-rose-400" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-rose-400">
                REAL MONEY PAYMENT VERIFIED
              </span>
              <h3 className="font-serif text-2xl text-rose-100 font-bold mt-1">
                YOUR BOOK IS NOW UNLOCKED
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm mx-auto">
                <strong className="text-rose-200">{book.title}</strong> has been added to your personal library.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleStartReading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>START READING NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
