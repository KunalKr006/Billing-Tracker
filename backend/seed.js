import 'dotenv/config';
import mongoose from 'mongoose';
import { Category, Client, Payment, WorkEntry } from './src/app.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ledger');
  if (await Client.exists({ name: 'Influencer Client' })) {
    console.log('Demo data already exists.');
    await mongoose.disconnect();
    return;
  }
  const client = await Client.create({ name: 'Influencer Client', phone: '+91 9999999999' });
  const [fullVideo, textAdd] = await Category.create([
    { name: 'Full Video', default_rate: 250, description: 'Full-length video editing' },
    { name: 'Graphics/Text', default_rate: 1000, description: 'Graphics and text editing' },
  ]);
  const fullVideoTitles = ['Rima\'s Kitchen', 'Super Bazaar', 'Clear Vision', 'Aptech', 'Peter England'];
  const textAddTitles = ['Ronauk Catering', 'Electronics', 'Mina Bazaar', 'Sohail Mobile', 'Abua Rakhi', 'Sri Modi Mobile', 'Neelam Jewellers'];
  await WorkEntry.insertMany([
    ...fullVideoTitles.map((title, index) => ({ client_id: client._id, category_id: fullVideo._id, title, work_date: new Date(Date.UTC(2026, 7, index + 1)), rate: 250 })),
    ...textAddTitles.map((title, index) => ({ client_id: client._id, category_id: textAdd._id, title, work_date: new Date(Date.UTC(2026, 7, index + 6)), rate: 1000 })),
  ]);
  await Payment.create({ client_id: client._id, amount: 3350, payment_date: new Date(Date.UTC(2026, 7, 20)), for_month: 8, for_year: 2026, payment_method: 'upi', notes: 'August partial payment via UPI' });
  console.log('Demo data seeded. August 2026 bill: 8250, paid: 3350, balance: 4900.');
  await mongoose.disconnect();
};

run().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });