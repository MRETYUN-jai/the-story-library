import nodemailer from 'nodemailer';

interface SendOtpOptions {
  to: string;
  code: string;
  type?: 'login' | 'signup' | 'reset';
  userName?: string;
}

/**
 * Creates and configures the nodemailer transporter.
 * Supports Gmail SMTP via App Passwords or standard SMTP hosts.
 */
function getTransporter() {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || process.env.GMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

  if (emailUser && emailPass && emailPass.trim() !== '') {
    return nodemailer.createTransport({
      service: 'gmail',
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser.trim(),
        pass: emailPass.replace(/\s+/g, ''), // Strip spaces if pasted from Google App Password (e.g. abcd efgh ijkl mnop)
      },
    });
  }

  return null;
}

/**
 * Ultra-fast HTTP email delivery using Resend API (<150ms latency)
 */
async function sendViaResend({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim().startsWith('re_')) return null;

  try {
    const fromAddress = process.env.RESEND_FROM || 'StoryVault <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) {
      console.log(`[StoryVault Resend] ⚡ Instant email delivered to ${Array.isArray(to) ? to.join(', ') : to} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } else {
      console.warn(`[StoryVault Resend] ⚠️ Resend note:`, data);
      return null;
    }
  } catch (err: any) {
    console.warn(`[StoryVault Resend] ⚠️ Resend request fallback:`, err?.message);
    return null;
  }
}

/**
 * Sends a branded 6-digit OTP verification email directly to the recipient's Gmail inbox.
 */
export async function sendOtpEmail({ to, code, type = 'signup', userName }: SendOtpOptions): Promise<{ success: boolean; sentViaSmtp: boolean; error?: string }> {
  const subjectText = type === 'login'
    ? `StoryVault Login OTP: ${code}`
    : `StoryVault Verification Code: ${code}`;

  const actionDescription = type === 'login'
    ? 'use the 6-digit OTP below to securely log into your account'
    : 'use the 6-digit OTP below to verify your Gmail address and complete registration';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subjectText}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#080C14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080C14;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0E1422;border:1px solid #1E293E;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
                
                <!-- Brand Header -->
                <tr>
                  <td align="center" style="padding:36px 30px 20px 30px;background:linear-gradient(180deg,#141B2D 0%,#0E1422 100%);border-bottom:1px solid #1E293E;">
                    <div style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#FDA4AF;text-transform:uppercase;font-family:Georgia,serif;">
                      STORYVAULT
                    </div>
                    <div style="font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">
                      Stories of Unsaid Feelings • Mretyun Jai B
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:36px 36px 28px 36px;">
                    <div style="font-size:18px;font-weight:bold;color:#FFF1F2;margin-bottom:12px;font-family:Georgia,serif;">
                      ${userName ? `Hello, ${userName}` : 'Hello Dear Reader'},
                    </div>
                    <div style="font-size:14px;line-height:1.6;color:#cbd5e1;margin-bottom:28px;">
                      Please ${actionDescription}. This code is valid for <strong>10 minutes</strong>.
                    </div>

                    <!-- 6-Digit Code Display Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center" style="background-color:#080C14;border:2px dashed #F43F5E;border-radius:18px;padding:24px 20px;">
                          <div style="font-size:11px;font-weight:bold;letter-spacing:2px;color:#FDA4AF;text-transform:uppercase;margin-bottom:8px;">
                            Your One-Time Password (OTP)
                          </div>
                          <div style="font-size:38px;font-weight:bold;letter-spacing:8px;color:#FFFFFF;font-family:Courier,monospace;">
                            ${code}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size:12px;line-height:1.5;color:#64748b;margin-bottom:16px;">
                      ⚠️ If you did not request this verification code, please ignore this email or reach out to support. Never share your OTP with anyone.
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding:20px 30px;background-color:#080C14;border-top:1px solid #1E293E;font-size:11px;color:#64748b;">
                    © 2026 StoryVault • Crafted for every quiet soul.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // ⚡ Priority 1: Instant Resend REST API Delivery
  const resendResult = await sendViaResend({
    to,
    subject: subjectText,
    text: `Your StoryVault verification code is: ${code}. Valid for 10 minutes.`,
    html: htmlContent,
  });

  if (resendResult && resendResult.success) {
    return { success: true, sentViaSmtp: true };
  }

  // 🛡️ Priority 2: Fallback to Gmail SMTP
  const transporter = getTransporter();

  if (transporter) {
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"StoryVault Security" <${fromEmail}>`,
        to,
        subject: subjectText,
        text: `Your StoryVault verification code is: ${code}. Valid for 10 minutes.`,
        html: htmlContent,
      });

      console.log(`[StoryVault Email Service] ✅ Real email sent to ${to} with code: ${code}`);
      return { success: true, sentViaSmtp: true };
    } catch (err: any) {
      console.error(`[StoryVault Email Service] ❌ SMTP Error sending to ${to}:`, err);
      return { success: false, sentViaSmtp: false, error: err.message };
    }
  } else {
    // If SMTP credentials not provided yet in .env, log clearly to terminal
    console.log(`\n======================================================`);
    console.log(`[StoryVault Email Service] 📧 DISPATCHING EMAIL TO: ${to}`);
    console.log(`[StoryVault Email Service] 🔑 6-DIGIT OTP CODE: ${code}`);
    console.log(`[StoryVault Email Service] ℹ️ To deliver via real Gmail inbox, set RESEND_API_KEY or EMAIL_USER and EMAIL_PASS in your .env file.`);
    console.log(`======================================================\n`);
    return { success: true, sentViaSmtp: false };
  }
}

interface PaymentAlertOptions {
  readerName: string;
  readerEmail: string;
  bookTitle: string;
  amount: number;
  utrNumber: string;
  receiptUrl?: string;
  approvalToken: string;
}

/**
 * Sends an instant purchase notification to the Author with a 1-Tap Approve button.
 */
export async function sendAuthorPaymentAlert({
  readerName,
  readerEmail,
  bookTitle,
  amount,
  utrNumber,
  receiptUrl,
  approvalToken,
}: PaymentAlertOptions): Promise<{ success: boolean; error?: string }> {
  const authorEmail = process.env.EMAIL_USER || 'the.story.vault.2306@gmail.com';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const approveUrl = `${appUrl}/api/admin/approve-purchase?token=${approvalToken}&action=approve`;
  const rejectUrl = `${appUrl}/api/admin/approve-purchase?token=${approvalToken}&action=reject`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Purchase Verification Request</title>
      </head>
      <body style="margin:0;padding:0;background-color:#080C14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080C14;padding:30px 15px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="580px" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#0E1422;border:1px solid #1E293E;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
                
                <!-- Brand Header -->
                <tr>
                  <td align="center" style="padding:28px 24px 18px 24px;background:linear-gradient(180deg,#141B2D 0%,#0E1422 100%);border-bottom:1px solid #1E293E;">
                    <div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:#F43F5E;text-transform:uppercase;">
                      🔔 DIRECT UPI PAYMENT ALERT
                    </div>
                    <div style="font-size:22px;font-weight:bold;color:#FFF1F2;margin-top:6px;font-family:Georgia,serif;">
                      ₹${amount} Received for "${bookTitle}"
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:28px 28px 20px 28px;">
                    <div style="font-size:14px;line-height:1.6;color:#cbd5e1;margin-bottom:20px;">
                      A reader has submitted a direct UPI bank payment receipt. Please check your Google Pay / PhonePe app to verify receipt of <strong>₹${amount}</strong>:
                    </div>

                    <!-- Details Table -->
                    <table width="100%" cellpadding="10" cellspacing="0" style="background-color:#080C14;border:1px solid #1E293E;border-radius:16px;margin-bottom:24px;font-size:13px;">
                      <tr>
                        <td style="color:#94a3b8;border-bottom:1px solid #141B2D;width:35%;">Book Title:</td>
                        <td style="color:#FFF1F2;font-weight:bold;border-bottom:1px solid #141B2D;">${bookTitle}</td>
                      </tr>
                      <tr>
                        <td style="color:#94a3b8;border-bottom:1px solid #141B2D;">Amount:</td>
                        <td style="color:#10B981;font-weight:bold;font-size:16px;border-bottom:1px solid #141B2D;">₹${amount}</td>
                      </tr>
                      <tr>
                        <td style="color:#94a3b8;border-bottom:1px solid #141B2D;">Reader:</td>
                        <td style="color:#cbd5e1;border-bottom:1px solid #141B2D;"><strong>${readerName}</strong> (${readerEmail})</td>
                      </tr>
                      <tr>
                        <td style="color:#94a3b8;">12-Digit UPI UTR:</td>
                        <td style="color:#FDA4AF;font-family:monospace;font-size:16px;font-weight:bold;">${utrNumber}</td>
                      </tr>
                    </table>

                    ${receiptUrl ? `
                      <div style="margin-bottom:24px;text-align:center;">
                        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#94a3b8;letter-spacing:1px;margin-bottom:8px;">
                          Uploaded Payment Receipt Screenshot:
                        </div>
                        <a href="${receiptUrl.startsWith('http') ? receiptUrl : `${appUrl}${receiptUrl}`}" target="_blank" style="display:inline-block;border:1px solid #283652;border-radius:12px;overflow:hidden;max-width:320px;">
                          <img src="${receiptUrl.startsWith('http') ? receiptUrl : `${appUrl}${receiptUrl}`}" alt="Payment Receipt" style="width:100%;max-height:260px;object-fit:cover;display:block;" />
                        </a>
                      </div>
                    ` : ''}

                    <!-- 1-TAP ACTION BUTTONS -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td align="center" style="padding-bottom:12px;">
                          <a href="${approveUrl}" style="display:block;width:90%;background:linear-gradient(90deg,#059669,#10B981);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:bold;padding:16px 20px;border-radius:14px;text-align:center;box-shadow:0 8px 20px rgba(16,185,129,0.3);letter-spacing:1px;text-transform:uppercase;">
                            ✔ 1-TAP APPROVE & UNLOCK BOOK
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="${rejectUrl}" style="display:inline-block;color:#f87171;text-decoration:none;font-size:12px;font-weight:bold;padding:8px 16px;border-radius:8px;background-color:#1c1017;border:1px solid #7f1d1d;">
                            ✖ Reject (Fake UTR / Not Received)
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size:11px;line-height:1.5;color:#64748b;text-align:center;">
                      Tapping Approve instantly unlocks the book in the reader's library and dispatches an unlock email confirmation.
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="padding:16px 24px;background-color:#080C14;border-top:1px solid #1E293E;font-size:11px;color:#64748b;">
                    StoryVault Author Control Center • Mretyun Jai B
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // ⚡ Priority 1: Instant Resend Delivery
  const resendResult = await sendViaResend({
    to: authorEmail,
    subject: `🔔 [Action Required] New Payment: ₹${amount} for "${bookTitle}" (UTR: ${utrNumber})`,
    text: `New Book Purchase Request: ₹${amount} from ${readerName} (${readerEmail}) for "${bookTitle}". UTR: ${utrNumber}. Approve link: ${approveUrl}`,
    html: htmlContent,
  });

  if (resendResult && resendResult.success) {
    return { success: true };
  }

  // 🛡️ Priority 2: Fallback to Gmail SMTP
  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"StoryVault Author Alert" <${authorEmail}>`,
        to: authorEmail,
        subject: `🔔 [Action Required] New Payment: ₹${amount} for "${bookTitle}" (UTR: ${utrNumber})`,
        text: `New Book Purchase Request: ₹${amount} from ${readerName} (${readerEmail}) for "${bookTitle}". UTR: ${utrNumber}. Approve link: ${approveUrl}`,
        html: htmlContent,
      });

      console.log(`[StoryVault Email Service] ✅ Author alert sent to ${authorEmail} for UTR: ${utrNumber}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[StoryVault Email Service] ❌ SMTP Error sending author alert:`, err);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[StoryVault Email Service] 🔔 AUTHOR PAYMENT ALERT: ₹${amount} for ${bookTitle}`);
    console.log(`[StoryVault Email Service] 👤 Reader: ${readerName} (${readerEmail})`);
    console.log(`[StoryVault Email Service] 🔑 UTR: ${utrNumber}`);
    console.log(`[StoryVault Email Service] 🔗 1-Tap Approve Link: ${approveUrl}`);
    console.log(`======================================================\n`);
    return { success: true };
  }
}

interface ReaderUnlockOptions {
  to: string;
  userName?: string;
  bookTitle: string;
  bookSlug: string;
}

/**
 * Sends a celebratory notification to the reader when the author approves their payment.
 */
export async function sendReaderPaymentApprovedEmail({
  to,
  userName,
  bookTitle,
  bookSlug,
}: ReaderUnlockOptions): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const readUrl = `${appUrl}/read/${bookSlug}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Book is Unlocked!</title>
      </head>
      <body style="margin:0;padding:0;background-color:#080C14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080C14;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="560px" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0E1422;border:1px solid #1E293E;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
                
                <tr>
                  <td align="center" style="padding:36px 30px 20px 30px;background:linear-gradient(180deg,#141B2D 0%,#0E1422 100%);border-bottom:1px solid #1E293E;">
                    <div style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#FDA4AF;text-transform:uppercase;font-family:Georgia,serif;">
                      STORYVAULT
                    </div>
                    <div style="font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;">
                      Payment Confirmed & Verified
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 36px 28px 36px;">
                    <div style="font-size:20px;font-weight:bold;color:#FFF1F2;margin-bottom:12px;font-family:Georgia,serif;">
                      ${userName ? `Hello, ${userName}` : 'Hello Dear Reader'},
                    </div>
                    <div style="font-size:14px;line-height:1.6;color:#cbd5e1;margin-bottom:24px;">
                      Author <strong>Mretyun Jai B</strong> has verified your direct UPI transfer! Full digital reading access for <strong>"${bookTitle}"</strong> is now unlocked in your digital library.
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <a href="${readUrl}" style="display:block;width:80%;background:linear-gradient(90deg,#E11D48,#BE123C);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:bold;padding:16px 20px;border-radius:14px;text-align:center;box-shadow:0 8px 24px rgba(225,29,72,0.35);letter-spacing:1px;text-transform:uppercase;">
                            📖 START READING NOW
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size:12px;line-height:1.5;color:#64748b;margin-bottom:8px;text-align:center;">
                      You can also access your book anytime from your <a href="${appUrl}/library" style="color:#FDA4AF;text-decoration:underline;">StoryVault Digital Library</a>.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:20px 30px;background-color:#080C14;border-top:1px solid #1E293E;font-size:11px;color:#64748b;">
                    © 2026 StoryVault • Stories of Unsaid Feelings
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // ⚡ Priority 1: Instant Resend Delivery
  const resendResult = await sendViaResend({
    to,
    subject: `🎉 Book Unlocked: "${bookTitle}" is ready in your StoryVault library!`,
    text: `Your payment was verified by Mretyun Jai B. Start reading "${bookTitle}" here: ${readUrl}`,
    html: htmlContent,
  });

  if (resendResult && resendResult.success) {
    return { success: true };
  }

  // 🛡️ Priority 2: Fallback to Gmail SMTP
  const transporter = getTransporter();

  if (transporter) {
    try {
      const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"StoryVault Editions" <${fromEmail}>`,
        to,
        subject: `🎉 Book Unlocked: "${bookTitle}" is ready in your StoryVault library!`,
        text: `Your payment was verified by Mretyun Jai B. Start reading "${bookTitle}" here: ${readUrl}`,
        html: htmlContent,
      });

      console.log(`[StoryVault Email Service] ✅ Reader unlock notification sent to ${to}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[StoryVault Email Service] ❌ SMTP Error sending unlock notification:`, err);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[StoryVault Email Service] 📖 READER UNLOCKED: ${to} for ${bookTitle} -> ${readUrl}`);
    return { success: true };
  }
}
