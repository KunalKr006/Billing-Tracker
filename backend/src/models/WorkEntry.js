import mongoose from 'mongoose';

const workEntrySchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  title: { type: String, required: true, trim: true },
  work_date: { type: Date, required: true },
  rate: { type: Number, required: true, min: 0 },
  notes: { type: String, default: null },
  status: { type: String, enum: ['completed', 'pending', 'cancelled'], default: 'completed' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false });

export default mongoose.model('WorkEntry', workEntrySchema);
