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

  // Real Money UPI QR state
  const [orderData, setOrderData] = useState<any>(null);
  const [utrInput, setUtrInput] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowUpiCheckout(false);
      setAppliedCoupon(null);
      setCouponInput('');
      setError('');
      setCouponError('');
      setUtrInput('');
      setPaymentSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalPayPrice = appliedCoupon ? appliedCoupon.finalPrice : book.price;
  const authorUpiId = process.env.NEXT_PUBLIC_AUTHOR_UPI_ID || 'mretyunjai006@oksbi';

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

      const data = await res.json();

      if (!res.ok) {
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

  // Step 3: Verify 12-Digit UTR Number
  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim() || utrInput.trim().length < 10) {
      setError('Please enter a valid 12-digit UPI Ref / UTR number from your payment receipt.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          utrNumber: utrInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Payment verification failed.');
        setLoading(false);
        return;
      }

      setPaymentSuccess(true);
    } catch (err) {
      setError('Failed to verify UTR transaction.');
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
  const upiDeepLink = `upi://pay?pa=${authorUpiId}&pn=Mretyun%20Jai%20B&am=${finalPayPrice}&cu=INR&tn=The%20Story%20Library%20${book.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[#0E1422] border border-[#1E293E] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative">
        
        {/* Close Button */}
        {!paymentSuccess && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1C2638] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {!paymentSuccess ? (
          !showUpiCheckout ? (
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

              {/* Order Summary */}
              <div className="bg-[#080C14] rounded-xl p-4 border border-[#1A2336] mb-4 space-y-3">
                <div className="flex items-center gap-4">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-md border border-[#283652] shadow-md"
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
              <div className="bg-[#080C14] rounded-xl p-3.5 border border-[#1A2336] mb-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Have a Promo or Coupon Code?</span>
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. LOVE50"
                      className="flex-1 bg-[#0E1422] border border-[#283652] focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 uppercase font-mono tracking-wider focus:outline-none"
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

              {/* UTR / Transaction Reference Form */}
              <form onSubmit={handleVerifyUtr} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Enter 12-Digit UPI Ref / UTR Number from Receipt
                  </label>
                  <input
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

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUpiCheckout(false)}
                    className="flex-1 py-3 rounded-xl border border-[#283652] text-slate-300 font-bold text-xs"
                  >
                    BACK
                  </button>

                  <button
                    type="submit"
                    disabled={loading || utrInput.length < 10}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40"
                  >
                    {loading ? 'VERIFYING TRANSACTION...' : 'VERIFY & UNLOCK BOOK'}
                  </button>
                </div>
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
