import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD nu sunt setate — sări peste seed admin');
    return;
  }
  const exists = await User.findOne({ role: 'admin' });
  if (exists) {
    if (process.env.NODE_ENV === 'test') {
      exists.email = email;
      exists.password = await bcrypt.hash(password, 10);
      await exists.save();
      console.log(`✅ Cont admin sincronizat pentru teste: ${email}`);
    }
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name: 'Administrator', email, password: hashed, role: 'admin' });
  console.log(`✅ Cont admin creat: ${email}`);
};
