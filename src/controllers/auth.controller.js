import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendEmail } from '../services/notifications.service.js';

const COOKIE_NAME = 'token';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // Frontend and API are hosted on different Render domains in production.
  // Cross-site cookies must use SameSite=None and Secure, otherwise the
  // browser accepts login but does not send the cookie on the next API call.
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES || '7d' }
);

const setTokenCookie = (res, user) => {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  return token;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Câmpuri lipsă' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email deja folosit' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password: hashed });
  const token = setTokenCookie(res, user);
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Credențiale invalide' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: 'Credențiale invalide' });
  const token = setTokenCookie(res, user);
  res.json({ user, token });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim(), phone: phone?.trim() || '' },
    { new: true }
  );
  res.json({ user });
});

export const updateFavorites = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids trebuie să fie array' });
  await User.findByIdAndUpdate(req.user._id, { favorites: ids });
  res.json({ ok: true });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Date lipsă' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere' });
  const user = await User.findById(req.user._id).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) return res.status(401).json({ error: 'Parola curentă este greșită' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  // Always respond the same to prevent email enumeration
  if (!email) return res.status(400).json({ error: 'Email lipsă' });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    user.resetToken = hashed;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await sendEmail({
      to: { email: user.email, name: user.name },
      subject: 'Resetare parolă',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="margin:0 0 8px;color:#1C1410">Resetare parolă</h2>
          <p style="color:#6B5E55;margin:0 0 24px">Ai solicitat resetarea parolei pentru contul <strong>${user.email}</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#8B3E2A;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Resetează parola</a>
          <p style="color:#A0918A;font-size:12px;margin:24px 0 0">Link-ul expiră în 1 oră. Dacă nu ai solicitat resetarea, ignoră acest email.</p>
        </div>
      `,
    });
  }
  res.json({ ok: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Date lipsă' });
  if (password.length < 6) return res.status(400).json({ error: 'Parola trebuie să aibă cel puțin 6 caractere' });

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetToken: hashed,
    resetTokenExpiry: { $gt: new Date() },
  }).select('+resetToken +resetTokenExpiry');

  if (!user) return res.status(400).json({ error: 'Link invalid sau expirat' });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  const authToken = setTokenCookie(res, user);
  res.json({ user, token: authToken });
});
