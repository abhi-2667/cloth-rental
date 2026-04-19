const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedTransportMode = null;

const isPlaceholderValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('your_') || normalized.includes('example.com') || normalized.includes('your-email') || normalized.includes('your_email') || normalized.includes('password');
};

const hasUsableSmtpConfig = () => {
  return !isPlaceholderValue(process.env.SMTP_HOST)
    && !isPlaceholderValue(process.env.SMTP_USER)
    && !isPlaceholderValue(process.env.SMTP_PASS);
};

const isProductionRuntime = () => String(process.env.NODE_ENV || '').toLowerCase() === 'production';

const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!hasUsableSmtpConfig() && isProductionRuntime()) {
    throw new Error('SMTP configuration is required in production for auth emails');
  }

  if (hasUsableSmtpConfig()) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    cachedTransportMode = 'smtp';
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
  cachedTransportMode = 'preview';

  return cachedTransporter;
};

const sendAuthEmail = async ({ toEmail, subject, html, previewLabel }) => {
  const transporter = await getTransporter();
  const transporterModeAtSend = cachedTransportMode;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || `Cloth Rental <no-reply@localhost>`;
  const magicLinkMatch = String(html || '').match(/href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i);
  const magicLink = magicLinkMatch ? (magicLinkMatch[1] || magicLinkMatch[2] || magicLinkMatch[3]) : '';
  const textContent = [
    String(subject || ''),
    '',
    'Please use the secure link below:',
    magicLink || '(link unavailable)',
    '',
    'If you did not request this email, you can safely ignore it.',
  ].join('\n');
  let info;
  let usedFallbackTransport = false;

  try {
    info = await transporter.sendMail({
      from,
      to: toEmail,
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER,
      subject,
      text: textContent,
      html,
    });
  } catch (error) {
    if (!hasUsableSmtpConfig()) {
      throw error;
    }

    if (isProductionRuntime()) {
      throw new Error(`SMTP send failed: ${error.message}`);
    }

    console.warn(`SMTP send failed for ${toEmail}, falling back to preview transport: ${error.message}`);
    cachedTransporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
    cachedTransportMode = 'preview';
    usedFallbackTransport = true;

    info = await cachedTransporter.sendMail({
      from,
      to: toEmail,
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER,
      subject,
      text: textContent,
      html,
    });
  }

  const sentWithPreviewTransport = transporterModeAtSend === 'preview' || usedFallbackTransport || !hasUsableSmtpConfig();

  if (sentWithPreviewTransport) {
    const message = info.message ? info.message.toString('utf8') : '';
    const label = previewLabel || 'Auth email preview';
    console.log(`${label} for ${toEmail}:\n${message}`);

    if (magicLink) {
      console.log(`Magic link (preview): ${magicLink}`);
    }

    return {
      delivered: false,
      mode: 'preview',
      magicLink,
    };
  }

  return {
    delivered: true,
    mode: 'smtp',
    magicLink: null,
  };
};

const sendOtpEmail = async ({ toEmail, otp, purpose }) => {
  const appName = process.env.APP_NAME || 'Cloth Rental';
  const expiryMinutes = 10;
  const subject = purpose === 'login'
    ? `${appName}: Your login OTP`
    : `${appName}: Verify your account`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:16px;border:1px solid #eee;border-radius:8px">
      <h2 style="margin:0 0 12px">${appName}</h2>
      <p style="margin:0 0 12px">Your one-time password is:</p>
      <div style="font-size:30px;letter-spacing:6px;font-weight:bold;margin:10px 0 14px">${otp}</div>
      <p style="margin:0 0 6px">This OTP expires in ${expiryMinutes} minutes.</p>
      <p style="margin:0;color:#666">If you did not request this, you can ignore this email.</p>
    </div>
  `;

  return sendAuthEmail({ toEmail, subject, html, previewLabel: 'OTP email preview' });
};

module.exports = { sendOtpEmail, sendAuthEmail };
