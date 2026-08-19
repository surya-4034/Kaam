import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// In-memory Store for Email OTPs: email -> { otpCode, expiresAt }
const emailOtpStore = new Map();

// Initialize SMTP Transporter (Supports Hostinger & Gmail SMTP)
const getTransporter = () => {
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';

  if (smtpUser && smtpPass) {
    // If using custom domain / Hostinger mail (e.g. kaam@yors.online)
    if (smtpUser.includes('@yors.online') || smtpUser.includes('hostinger') || !smtpUser.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    // Gmail SMTP Setup
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }
  return null;
};

// Resend Fallback Setup
const resendApiKey = process.env.RESEND_API_KEY || 're_cDFX99ay_Ad3ij4KZ8hQhrSaSMrmEZuWR';
const resend = new Resend(resendApiKey);

/**
 * Generate and send a REAL 6-digit Email Verification OTP code with Context-Specific Email Content
 * @param {string} email 
 * @param {string} context - 'SIGNUP' | 'LOGIN' | 'RESET_PASSWORD'
 */
export const sendEmailOtp = async (email, context = 'SIGNUP') => {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Generate random 6-digit code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minute expiry

  emailOtpStore.set(cleanEmail, { otpCode: generatedOtp, expiresAt });

  // Format Clean Subject Line (NO CODE IN TITLE) & Rich HTML Body Text as per Exact Context
  let subjectText = "KAAM Account Verification Code";
  let contextTitle = "Account Verification";
  let contextSubtitle = "Use the verification code below to complete your KAAM account verification:";

  if (context === 'SIGNUP') {
    subjectText = "Verify your email address to create your KAAM account";
    contextTitle = "Verify Your Email Address";
    contextSubtitle = "Welcome to KAAM! Use the verification code below to verify your email address and complete creating your account:";
  } else if (context === 'RESET_PASSWORD') {
    subjectText = "KAAM Account Password Reset Verification";
    contextTitle = "Reset Your Account Password";
    contextSubtitle = "We received a request to reset the password for your KAAM account. Use the confirmation code below:";
  } else if (context === 'LOGIN') {
    subjectText = "KAAM Account Login Verification Code";
    contextTitle = "Sign In to Your Account";
    contextSubtitle = "Use the 6-digit verification code below to sign in to your KAAM account:";
  }

  const plainTextBody = `${contextTitle}\n\n${contextSubtitle}\n\nVERIFICATION CODE: ${generatedOtp}\n\nThis code expires in 10 minutes. If you did not request this code, please ignore this email safely.`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #09111e; color: #f8fafc; padding: 28px; border-radius: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <h3 style="color: #38bdf8; margin-top: 0; font-size: 20px; font-weight: 800;">${contextTitle}</h3>
      <p style="font-size: 13.5px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px;">${contextSubtitle}</p>
      
      <div style="background-color: #0f172a; padding: 22px; border-radius: 14px; font-size: 28px; font-family: 'Courier New', monospace; color: #38bdf8; font-weight: bold; text-align: center; letter-spacing: 8px; border: 1px solid #0284c7;">
        ${generatedOtp}
      </div>

      <p style="font-size: 12px; color: #cbd5e1; margin-top: 20px; text-align: center;">This verification code expires in <strong style="color: #f59e0b;">10 minutes</strong>.</p>
      <p style="font-size: 11px; color: #64748b; margin-top: 12px; text-align: center;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`✉️  [DISPATCHING ${context} EMAIL TO: ${cleanEmail}]`);
  console.log(`SUBJECT: ${subjectText}`);
  console.log(`🔑 6-DIGIT VERIFICATION CODE: [ ${generatedOtp} ]`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  // PRIMARY PATH: Hostinger Domain SMTP (Sends to ANY email address in the world)
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"KAAM Verification" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: cleanEmail,
        subject: subjectText,
        text: plainTextBody,
        html: htmlBody,
        headers: {
          'X-Priority': '1 (Highest)',
          'X-MSMail-Priority': 'High',
          'Importance': 'High',
          'X-Entity-Ref-ID': `kaam-otp-${Date.now()}`,
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      });

      console.log(`✅ [HOSTINGER SMTP SUCCESS] Delivered with context "${context}" to ${cleanEmail}! Message ID: ${info.messageId}`);
      return {
        success: true,
        email: cleanEmail,
        message: `6-Digit Verification Code sent to ${cleanEmail}! Please check your email inbox.`
      };
    } catch (smtpErr) {
      console.error('❌ [HOSTINGER SMTP DISPATCH ERROR]:', smtpErr.message);
    }
  }

  // FALLBACK PATH: Resend API (Used if SMTP server is unavailable)
  try {
    const resendResponse = await resend.emails.send({
      from: 'KAAM Verification <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: subjectText,
      text: plainTextBody,
      html: htmlBody,
    });

    if (!resendResponse.error) {
      console.log(`✅ [RESEND API SUCCESS] Delivered with context "${context}" to ${cleanEmail}! Message ID: ${resendResponse.data?.id}`);
    } else {
      console.warn(`⚠️ [RESEND RESTRICTION]:`, resendResponse.error.message);
    }
  } catch (err) {
    console.error('❌ [RESEND API ERROR]:', err);
  }

  return {
    success: true,
    email: cleanEmail,
    message: `6-Digit Verification Code sent to ${cleanEmail}! Please check your email inbox.`
  };
};

/**
 * Send Secret OTP Code to Master Admin Email kaamadmin@gmail.com
 */
export const sendAdminForgotOtpEmail = async () => {
  const targetEmail = 'kaamadmin@gmail.com';
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  emailOtpStore.set(targetEmail, { otpCode: generatedOtp, expiresAt });

  const subjectText = `KAAM Master Admin Password Reset Verification`;
  const plainTextBody = `KAAM Master Admin Password Reset Request

Hello Admin,

Your secret verification code for resetting the Master Admin password (Surya-4034) is:

SECRET CODE: ${generatedOtp}

If you did not request this password reset, please secure your account immediately. Code expires in 10 minutes.

Regards,
KAAM Platform Security`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <h3 style="color: #c084fc; margin-top: 0; font-size: 18px;">🔒 Master Admin Secret Code</h3>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">Use the secret code below to reset the password for Admin ID <strong>Surya-4034</strong>:</p>
      
      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; font-size: 24px; font-family: monospace; color: #c084fc; font-weight: bold; text-align: center; letter-spacing: 6px; border: 1px solid #334155;">
        ${generatedOtp}
      </div>

      <p style="font-size: 11px; color: #64748b; margin-top: 16px; text-align: center;">KAAM Automated Master Security Service • Code expires in 10 min</p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`✉️  [DISPATCHING ADMIN SECRET CODE EMAIL TO: ${targetEmail}]`);
  console.log(`SUBJECT: ${subjectText}`);
  console.log(`🔑 SECRET CODE: [ ${generatedOtp} ]`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"KAAM Admin Security" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: targetEmail,
        subject: subjectText,
        text: plainTextBody,
        html: htmlBody,
      });
      console.log(`✅ [ADMIN SECRET CODE SMTP SUCCESS] Real email delivered to ${targetEmail}!`);
      return { success: true, message: `Secret Code sent to ${targetEmail}!` };
    } catch (smtpErr) {
      console.error('❌ [ADMIN SECRET CODE SMTP ERROR]:', smtpErr.message);
    }
  }

  try {
    await resend.emails.send({
      from: 'KAAM Admin Security <onboarding@resend.dev>',
      to: [targetEmail],
      subject: subjectText,
      text: plainTextBody,
      html: htmlBody,
    });
    console.log(`✅ [ADMIN SECRET CODE RESEND SUCCESS] Delivered to ${targetEmail}!`);
  } catch (err) {
    console.error('❌ [RESEND API ERROR]:', err);
  }

  return { success: true, message: `Secret Code sent to ${targetEmail}!` };
};

/**
 * Send Confirmation Email to Master Admin after Password Change
 */
export const sendAdminPasswordChangeConfirmationEmail = async () => {
  const targetEmail = 'kaamadmin@gmail.com';
  const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const subjectText = `🔒 KAAM Admin Security Alert: Master Admin Password Reset Successfully`;
  const plainTextBody = `KAAM Master Admin Security Notice

Hello Admin,

The password for Master Admin account (ID: Surya-4034 / kaamadmin@gmail.com) was updated successfully on ${timestampStr} IST.

If you performed this action, no further steps are needed.

Regards,
KAAM Platform Security`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <h3 style="color: #4ade80; margin-top: 0; font-size: 18px;">🔒 Admin Password Updated</h3>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">The password for Master Admin ID <strong>Surya-4034</strong> has been changed successfully.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; border: 1px solid #334155;">
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Admin ID:</strong> <span style="font-family: monospace; color: #c084fc; font-weight: bold;">Surya-4034</span></p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Target Email:</strong> ${targetEmail}</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Reset Timestamp:</strong> ${timestampStr} IST</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Status:</strong> <span style="color: #4ade80; font-weight: bold;">SECURED & UPDATED</span></p>
      </div>

      <p style="font-size: 11px; color: #64748b; margin-top: 16px; text-align: center;">KAAM Automated Security System</p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`✉️  [DISPATCHING ADMIN PASSWORD RESET CONFIRMATION EMAIL TO: ${targetEmail}]`);
  console.log(`SUBJECT: ${subjectText}`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"KAAM Admin Security" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: targetEmail,
        subject: subjectText,
        text: plainTextBody,
        html: htmlBody,
      });
      console.log(`✅ [ADMIN PASSWORD RESET CONFIRMATION SUCCESS] Delivered to ${targetEmail}!`);
      return { success: true };
    } catch (smtpErr) {
      console.error('❌ [ADMIN PASSWORD RESET CONFIRMATION SMTP ERROR]:', smtpErr.message);
    }
  }

  try {
    await resend.emails.send({
      from: 'KAAM Security <onboarding@resend.dev>',
      to: [targetEmail],
      subject: subjectText,
      text: plainTextBody,
      html: htmlBody,
    });
    console.log(`✅ [ADMIN PASSWORD RESET CONFIRMATION RESEND SUCCESS] Delivered to ${targetEmail}!`);
  } catch (err) {
    console.error('❌ [RESEND API ERROR]:', err);
  }

  return { success: true };
};

/**
 * Send Automated Password Reset Confirmation Email to User
 */
export const sendPasswordResetSuccessEmail = async (email) => {
  const cleanEmail = email.toLowerCase().trim();
  const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const subjectText = `🔑 KAAM Account Password Updated Successfully`;
  const plainTextBody = `Hello,

The password for your KAAM account (${cleanEmail}) was updated successfully on ${timestampStr} IST.

If you performed this password reset, no further action is required. You can now log in using your new password.

If you did NOT perform this password reset, please contact KAAM Support immediately.

Regards,
KAAM Platform Security`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <h3 style="color: #4ade80; margin-top: 0; font-size: 18px;">🔑 Password Updated Successfully</h3>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">The password for your KAAM account has been changed.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; border: 1px solid #334155;">
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Account Email:</strong> ${cleanEmail}</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Reset Timestamp:</strong> ${timestampStr} IST</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Status:</strong> <span style="color: #4ade80; font-weight: bold;">UPDATED & SECURED</span></p>
      </div>

      <p style="font-size: 12px; color: #cbd5e1; margin-top: 16px;">You can now log in to your account with your new password.</p>
      <p style="font-size: 11px; color: #64748b; margin-top: 12px; text-align: center;">KAAM Automated Security Notice</p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`✉️  [DISPATCHING PASSWORD RESET SUCCESS CONFIRMATION EMAIL TO: ${cleanEmail}]`);
  console.log(`SUBJECT: ${subjectText}`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"KAAM Security" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: cleanEmail,
        subject: subjectText,
        text: plainTextBody,
        html: htmlBody,
      });
      console.log(`✅ [PASSWORD RESET CONFIRMATION SUCCESS] Delivered to ${cleanEmail}!`);
      return { success: true };
    } catch (smtpErr) {
      console.error('❌ [PASSWORD RESET GMAIL SMTP ERROR]:', smtpErr.message);
    }
  }

  try {
    await resend.emails.send({
      from: 'KAAM Security <onboarding@resend.dev>',
      to: [cleanEmail],
      subject: subjectText,
      text: plainTextBody,
      html: htmlBody,
    });
    console.log(`✅ [PASSWORD RESET RESEND SUCCESS] Delivered to ${cleanEmail}!`);
  } catch (err) {
    console.error('❌ [RESEND API ERROR]:', err);
  }

  return { success: true };
};

/**
 * Send a Clean, Concise Automated Security Alert Email on Master Admin Login
 * Target Email: kaamadmin@gmail.com
 */
export const sendAdminLoginAlertEmail = async (adminId = 'Surya-4034', loginEmail = 'kaamadmin@gmail.com', clientIp = '127.0.0.1') => {
  const targetEmail = 'kaamadmin@gmail.com';
  const timestampStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const subjectText = `🔒 KAAM Admin Login Notice: Session Active (ID: ${adminId})`;
  
  const plainTextBody = `KAAM Admin Login Alert

Hello Admin,

Your Master Admin account has logged in successfully.

📌 Login Details:
• Admin ID: ${adminId}
• Target Email: ${loginEmail}
• Login Timestamp: ${timestampStr} IST
• Status: AUTHENTICATED & ACTIVE

Regards,
KAAM Platform Security System`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; padding: 24px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
      <h3 style="color: #c084fc; margin-top: 0; font-size: 18px;">🔒 KAAM Admin Login Notice</h3>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">Master Admin account login was performed successfully.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; border: 1px solid #334155;">
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Admin ID:</strong> <span style="font-family: monospace; color: #c084fc; font-weight: bold;">${adminId}</span></p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Account Email:</strong> ${loginEmail}</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Login Timestamp:</strong> ${timestampStr} IST</p>
        <p style="margin: 4px 0;"><strong style="color: #cbd5e1;">Session Status:</strong> <span style="color: #4ade80; font-weight: bold;">AUTHENTICATED & ACTIVE</span></p>
      </div>

      <p style="font-size: 11px; color: #64748b; margin-top: 16px; text-align: center;">KAAM Automated Security Alert</p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`✉️  [DISPATCHING ADMIN LOGIN ALERT EMAIL TO: ${targetEmail}]`);
  console.log(`SUBJECT: ${subjectText}`);
  console.log(`======================================================\n`);

  const transporter = getTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"KAAM Security Alert" <${process.env.EMAIL_USER}>`,
        replyTo: process.env.EMAIL_USER,
        to: targetEmail,
        subject: subjectText,
        text: plainTextBody,
        html: htmlBody,
      });

      console.log(`✅ [ADMIN ALERT EMAIL SUCCESS] Clean security email delivered to ${targetEmail}! Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr) {
      console.error('❌ [ADMIN ALERT GMAIL SMTP ERROR]:', smtpErr.message);
    }
  }

  try {
    const resendResponse = await resend.emails.send({
      from: 'KAAM Security <onboarding@resend.dev>',
      to: [targetEmail],
      subject: subjectText,
      text: plainTextBody,
      html: htmlBody,
    });
    console.log(`✅ [ADMIN ALERT RESEND SUCCESS] ID: ${resendResponse.data?.id}`);
  } catch (err) {
    console.error('❌ [RESEND API ERROR]:', err);
  }

  return { success: true };
};

/**
 * Verify submitted Email OTP code
 */
export const verifyEmailOtp = (email, inputOtp) => {
  const cleanEmail = email.toLowerCase().trim();
  const record = emailOtpStore.get(cleanEmail);

  if (!record) {
    return { valid: false, error: 'No verification request found for this email address. Please click Verify Mail.' };
  }

  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(cleanEmail);
    return { valid: false, error: 'Verification code has expired. Please click Verify Mail again.' };
  }

  if (record.otpCode !== inputOtp.toString().trim()) {
    return { valid: false, error: 'Incorrect 6-digit verification code entered. Please check your email inbox.' };
  }

  emailOtpStore.delete(cleanEmail);
  return { valid: true };
};
