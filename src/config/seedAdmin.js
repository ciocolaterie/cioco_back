import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export const seedAdmin = async () => {
  const exists = await User.findOne({ role: 'admin' });
  if (exists) return;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD nu sunt setate — sări peste seed admin');
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name: 'Administrator', email, password: hashed, role: 'admin' });
  console.log(`✅ Cont admin creat: ${email}`);
};
