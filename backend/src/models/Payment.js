import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  payment_date: { type: Date, required: true },
  for_month: { type: Number, min: 1, max: 12 },
  for_year: { type: Number, min: 2000, max: 2200 },
  payment_method: { type: String, enum: ['upi', 'bank_transfer', 'cash', 'other'], default: 'upi' },
  notes: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false });

export default mongoose.model('Payment', paymentSchema);
