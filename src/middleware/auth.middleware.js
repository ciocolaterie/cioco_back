import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const extractToken = (req) => {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Neautentificat' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User invalid' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid sau expirat' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acces interzis — doar administratori' });
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.id);
    }
  } catch {}
  next();
};
