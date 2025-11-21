import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pollos-don-agus';

async function run(){
  await mongoose.connect(MONGODB_URI, { dbName: 'pollos-don-agus' });
  const adminPin = process.env.ADMIN_PIN || '1234';
  const cajaPin = process.env.CAJA_PIN || '1111';
  await User.deleteMany({});
  await User.create([
    { name: 'Admin', role: 'admin', pinHash: await bcrypt.hash(adminPin, 10) },
    { name: 'Caja Principal', role: 'caja', pinHash: await bcrypt.hash(cajaPin, 10) },
  ]);
  console.log('Seed listo. Admin PIN:', adminPin, 'Caja PIN:', cajaPin);
  await mongoose.disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1); });
