import mongoose from 'mongoose';

export const connectDatabase = () => mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ledger',
);

export const databaseStatus = () => (
  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
);
