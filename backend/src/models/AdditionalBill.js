import mongoose from 'mongoose';

const additionalBillSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  bill_date: { type: Date, required: true },
  notes: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false });

export default mongoose.model('AdditionalBill', additionalBillSchema);
