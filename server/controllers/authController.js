const User = require('../models/User');
const Notification = require('../models/Notification');
const PendingRegistration = require('../models/PendingRegistration');
const MagicLinkToken = require('../models/MagicLinkToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const devStore = require('../utils/devStore');
const { sendAuthEmail } = require('../utils/otpEmail');

const useDevStore = !process.env.MONGO_URI;
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const generateMagicLinkToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const demoLoginAccounts = {
  'admin@cloth-rental.local': {
    name: 'Studio Admin',
    role: 'admin',
    approvalStatus: 'approved',
    password: 'Admin1234!',
  },
  'user@cloth-rental.local': {
    name: 'Studio User',
    role: 'user',
    approvalStatus: 'approved',
    password: 'User1234!',
  },
};

const ensureDemoMongoUser = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const demo = demoLoginAccounts[normalizedEmail];
  if (!demo || useDevStore) {
    return;
  }

  const hashedPassword = await bcrypt.hash(demo.password, 10);
  await User.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        name: demo.name,
        role: demo.role,
        approvalStatus: demo.approvalStatus,
        password: hashedPassword,
      },
      $setOnInsert: {
        email: normalizedEmail,
      },
    },
    { upsert: true }
  );
};

const findUserByEmailInsensitive = async (email) => {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return User.findOne({ email: new RegExp(`^${escaped}$`, 'i') });
};

const getClientBaseUrl = (req) => {
  const configured = String(process.env.CLIENT_URL || '').trim();
  const requestOrigin = String(req?.headers?.origin || '').trim();

  // In local development, prefer the actual caller origin so links match the active Vite port.
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production' && requestOrigin) {
    return requestOrigin;
  }

  return configured || requestOrigin || 'http://localhost:3000';
};

const buildClientLink = (req, pathname, token, mode) => {
  const url = new URL(pathname, getClientBaseUrl(req));
  url.searchParams.set('token', token);
  if (mode) {
    url.searchParams.set('mode', mode);
  }
  return url.toString();
};

const buildMagicLinkEmailHtml = ({ heading, message, ctaLabel, link }) => `
  <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:16px;border:1px solid #eee;border-radius:8px">
    <h2 style="margin:0 0 12px">Cloth Rental</h2>
    <p style="margin:0 0 12px"><strong>${heading}</strong></p>
    <p style="margin:0 0 12px">${message}</p>
    <p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;background:#d4af37;color:#1a2638;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">${ctaLabel}</a></p>
    <p style="margin:0 0 8px;color:#666">If the button does not open, copy and paste this link in your browser:</p>
    <p style="margin:0 0 12px;word-break:break-all"><a href="${link}">${link}</a></p>
    <p style="margin:0;color:#666">This link expires in 15 minutes.</p>
  </div>
`;

const getApprovalStatus = (user) => user?.approvalStatus || 'approved';
const isApprovedUser = (user) => getApprovalStatus(user) === 'approved';

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  approvalStatus: getApprovalStatus(user),
  createdAt: user.createdAt,
});

const buildAdminApprovalLink = (req, pendingUserId) => {
  const url = new URL('/admin', getClientBaseUrl(req));
  url.searchParams.set('approvalUserId', String(pendingUserId));
  return url.toString();
};

const buildAdminApprovalEmailHtml = ({ pendingUser, link }) => `
  <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:16px;border:1px solid #eee;border-radius:8px">
    <h2 style="margin:0 0 12px">Cloth Rental</h2>
    <p style="margin:0 0 12px"><strong>New signup awaiting approval</strong></p>
    <p style="margin:0 0 12px">${pendingUser.name} (${pendingUser.email}) has created an account and is waiting for review.</p>
    <p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;background:#d4af37;color:#1a2638;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">Review in admin dashboard</a></p>
    <p style="margin:0;color:#666">Open the dashboard to approve or reject the account.</p>
  </div>
`;

const getFirstApprovedAdmin = async () => {
  if (useDevStore) {
    return devStore.listUsers().find((user) => user.role === 'admin' && (user.approvalStatus || 'approved') === 'approved') || null;
  }

  return User.findOne({
    role: 'admin',
    $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: 'approved' }],
  }).select('_id name email role approvalStatus');
};

const notifyAdminAboutPendingSignup = async ({ req, pendingUser }) => {
  const adminUser = await getFirstApprovedAdmin();
  if (!adminUser) {
    return;
  }

  const adminUserId = adminUser.id || adminUser._id;
  const pendingUserId = String(pendingUser._id);
  const approvalLink = buildAdminApprovalLink(req, pendingUserId);
  const notificationTitle = 'New signup awaiting approval';
  const notificationMessage = `${pendingUser.name} (${pendingUser.email}) is waiting for review.`;

  if (useDevStore) {
    const existing = devStore.listNotificationsForUser(adminUserId).find((notification) => {
      return notification.type === 'account'
        && notification.metadata?.kind === 'signup-approval'
        && notification.metadata?.pendingUserId === pendingUserId;
    });

    if (!existing) {
      devStore.addNotification({
        userId: adminUserId,
        type: 'account',
        title: notificationTitle,
        message: notificationMessage,
        metadata: { kind: 'signup-approval', pendingUserId, approvalLink },
      });
    }
  } else {
    const existing = await Notification.findOne({
      userId: adminUserId,
      type: 'account',
      'metadata.kind': 'signup-approval',
      'metadata.pendingUserId': pendingUserId,
    });

    if (!existing) {
      await Notification.create({
        userId: adminUserId,
        type: 'account',
        title: notificationTitle,
        message: notificationMessage,
        metadata: { kind: 'signup-approval', pendingUserId, approvalLink },
      });
    }
  }

  try {
    await sendAuthEmail({
      toEmail: adminUser.email,
      subject: 'Cloth Rental: New signup awaiting approval',
      html: buildAdminApprovalEmailHtml({ pendingUser, link: approvalLink }),
      previewLabel: 'Admin approval email preview',
    });
  } catch (error) {
    console.warn(`Unable to send admin approval email to ${adminUser.email}: ${error.message}`);
  }
};

const createMagicLinkSession = async ({ jti, email, purpose, expectedRole, expiresAt }) => {
  const payload = {
    jti,
    email,
    purpose,
    expectedRole: expectedRole || null,
    expiresAt,
  };

  if (useDevStore) {
    devStore.createMagicLinkSession(payload);
    return;
  }

  await MagicLinkToken.create(payload);
};

const consumeMagicLinkSession = async ({ jti, email, purpose, expectedRole }) => {
  const normalizedExpectedRole = expectedRole || null;

  if (useDevStore) {
    return devStore.consumeMagicLinkSession({
      jti,
      email,
      purpose,
      expectedRole: normalizedExpectedRole,
    });
  }

  const session = await MagicLinkToken.findOne({ jti });

  if (!session) {
    return { ok: false, reason: 'not_found' };
  }

  if (session.usedAt) {
    return { ok: false, reason: 'already_used' };
  }

  if (session.expiresAt < new Date()) {
    return { ok: false, reason: 'expired' };
  }

  if (session.email !== email || session.purpose !== purpose) {
    return { ok: false, reason: 'invalid' };
  }

  if ((session.expectedRole || null) !== normalizedExpectedRole) {
    return { ok: false, reason: 'invalid' };
  }

  session.usedAt = new Date();
  await session.save();

  return { ok: true };
};

const getMagicLinkFailureMessage = (reason, expiredMessage) => {
  if (reason === 'expired') return expiredMessage;
  if (reason === 'already_used') return 'This verification link was already used. Please request a new link.';
  if (reason === 'not_found' || reason === 'invalid') return 'Invalid verification link';
  return 'Invalid verification link';
};

const respondMagicLinkRequest = (res, emailResult, successMessage, recipientEmail) => {
  if (!emailResult.delivered) {
    return res.status(503).json({
      message: 'Unable to send email right now. Please try again later.',
      attemptedTo: recipientEmail,
    });
  }

  return res.json({
    message: successMessage,
    deliveryMode: emailResult.mode,
    sentTo: recipientEmail,
  });
};

const requestSignupLink = async (req, res) => {
  return res.status(410).json({ message: 'Signup verification has been disabled. Use direct signup instead.' });
};

const verifySignupLink = async (req, res) => {
  return res.status(410).json({ message: 'Signup verification has been disabled. Use direct signup instead.' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (useDevStore) {
      const userExists = devStore.findUserByEmail(normalizedEmail);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = devStore.addUser({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        approvalStatus: 'pending',
      });

      await notifyAdminAboutPendingSignup({ req, pendingUser: user });

      return res.status(201).json({
        message: 'Account created. Waiting for admin approval.',
        user: toSafeUser(user),
      });
    }

    const userExists = await findUserByEmailInsensitive(normalizedEmail);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      approvalStatus: 'pending',
    });

    await notifyAdminAboutPendingSignup({ req, pendingUser: user });

    res.status(201).json({
      message: 'Account created. Waiting for admin approval.',
      user: toSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }

    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (useDevStore) {
      const user = devStore.findUserByEmail(normalizedEmail);

      if (user && !isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          user: toSafeUser(user),
          token: generateToken(user._id, user.role),
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await ensureDemoMongoUser(normalizedEmail);

    const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({ email: new RegExp(`^${escaped}$`, 'i') });

    if (!users.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    for (const user of users) {
      let passwordMatches = false;

      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        passwordMatches = await bcrypt.compare(password, user.password);
      } else if (String(user.password || '') === String(password)) {
        // Upgrade legacy plain-text passwords after a successful legacy login.
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        passwordMatches = true;
      }

      if (!passwordMatches) {
        continue;
      }

      if (!isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      return res.json({
        user: toSafeUser(user),
        token: generateToken(user._id, user.role),
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestLoginLink = async (req, res) => {
  try {
    const { email, expectedRole } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (useDevStore) {
      const user = devStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email' });
      }

      if (!isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (expectedRole && user.role !== expectedRole) {
        return res.status(403).json({
          message: expectedRole === 'admin'
            ? 'This account is not an admin account.'
            : 'This account is an admin account. Use admin login instead.'
        });
      }

      const jti = crypto.randomUUID();
      const linkExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const token = generateMagicLinkToken({ email: normalizedEmail, purpose: 'login', expectedRole, jti });
      const link = buildClientLink(req, '/verify-link', token, 'login');
      const html = buildMagicLinkEmailHtml({
        heading: 'Sign in to your account',
        message: 'Click the button below to sign in.',
        ctaLabel: 'Sign in',
        link,
      });

      const emailResult = await sendAuthEmail({
        toEmail: normalizedEmail,
        subject: 'Cloth Rental: Your sign-in link',
        html,
        previewLabel: 'Login magic-link preview',
      });

      await createMagicLinkSession({
        jti,
        email: normalizedEmail,
        purpose: 'login',
        expectedRole: expectedRole || null,
        expiresAt: linkExpiresAt,
      });

      return respondMagicLinkRequest(res, emailResult, 'Sign-in link sent successfully. Please check your email.', normalizedEmail);
    }

    const user = await findUserByEmailInsensitive(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (!isApprovedUser(user)) {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message: expectedRole === 'admin'
          ? 'This account is not an admin account.'
          : 'This account is an admin account. Use admin login instead.'
      });
    }

    const jti = crypto.randomUUID();
    const linkExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const token = generateMagicLinkToken({ email: normalizedEmail, purpose: 'login', expectedRole, jti });
    const link = buildClientLink(req, '/verify-link', token, 'login');
    const html = buildMagicLinkEmailHtml({
      heading: 'Sign in to your account',
      message: 'Click the button below to sign in.',
      ctaLabel: 'Sign in',
      link,
    });

    const emailResult = await sendAuthEmail({
      toEmail: normalizedEmail,
      subject: 'Cloth Rental: Your sign-in link',
      html,
      previewLabel: 'Login magic-link preview',
    });

    await createMagicLinkSession({
      jti,
      email: normalizedEmail,
      purpose: 'login',
      expectedRole: expectedRole || null,
      expiresAt: linkExpiresAt,
    });

    return respondMagicLinkRequest(res, emailResult, 'Sign-in link sent successfully. Please check your email.', normalizedEmail);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, expectedRole } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    if (useDevStore) {
      const user = devStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email' });
      }

      if (!isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (expectedRole && user.role !== expectedRole) {
        return res.status(403).json({
          message: expectedRole === 'admin'
            ? 'This account is not an admin account.'
            : 'This account is an admin account. Use admin login instead.'
        });
      }

      const pending = devStore.getPendingLoginOtpByEmail(normalizedEmail);
      if (!pending) {
        return res.status(400).json({ message: 'No login OTP request found for this email' });
      }

      if (new Date(pending.otpExpiresAt) < new Date()) {
        devStore.deletePendingLoginOtp(normalizedEmail);
        return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
      }

      if (pending.otp !== String(otp)) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      devStore.deletePendingLoginOtp(normalizedEmail);

      return res.json({
        user: toSafeUser(user),
        token: generateToken(user._id, user.role),
      });
    }

    const user = await findUserByEmailInsensitive(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (!isApprovedUser(user)) {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message: expectedRole === 'admin'
          ? 'This account is not an admin account.'
          : 'This account is an admin account. Use admin login instead.'
      });
    }

    if (!user.loginOtp || !user.loginOtpExpiresAt) {
      return res.status(400).json({ message: 'No login OTP request found for this email' });
    }

    if (new Date(user.loginOtpExpiresAt) < new Date()) {
      user.loginOtp = undefined;
      user.loginOtpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
    }

    if (String(user.loginOtp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.loginOtp = undefined;
    user.loginOtpExpiresAt = undefined;
    await user.save();

    return res.json({
      user: toSafeUser(user),
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyLoginLink = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    if (payload.purpose !== 'login' || !payload.email || !payload.jti) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const expectedRole = payload.expectedRole;
    const consumeResult = await consumeMagicLinkSession({
      jti: payload.jti,
      email: normalizedEmail,
      purpose: 'login',
      expectedRole,
    });

    if (!consumeResult.ok) {
      return res.status(400).json({
        message: getMagicLinkFailureMessage(consumeResult.reason, 'Sign-in link expired. Please request a new link.'),
      });
    }

    if (useDevStore) {
      const user = devStore.findUserByEmail(normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: 'No account found with this email' });
      }

      if (!isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (expectedRole && user.role !== expectedRole) {
        return res.status(403).json({
          message: expectedRole === 'admin'
            ? 'This account is not an admin account.'
            : 'This account is an admin account. Use admin login instead.'
        });
      }

      return res.json({
        user: toSafeUser(user),
        token: generateToken(user._id, user.role),
      });
    }

    const user = await findUserByEmailInsensitive(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (!isApprovedUser(user)) {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        message: expectedRole === 'admin'
          ? 'This account is not an admin account.'
          : 'This account is an admin account. Use admin login instead.'
      });
    }

    return res.json({
      user: toSafeUser(user),
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Sign-in link expired. Please request a new link.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  requestSignupLink,
  verifySignupLink,
  requestLoginLink,
  verifyLoginLink,
};
