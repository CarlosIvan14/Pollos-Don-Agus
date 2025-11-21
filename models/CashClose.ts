import mongoose, { Schema } from 'mongoose';

const CashCloseSchema = new Schema({
  date: { type: Date, required: true },
  totals: Schema.Types.Mixed, // aggregated breakdown
  note: String,
  closedBy: { type: String },
}, { timestamps: true });

export default mongoose.models.CashClose || mongoose.model('CashClose', CashCloseSchema);
