// models/Style.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface IStyle {
  _id?: Types.ObjectId;
  name: string; // 'asado', 'rostizado'
  displayName: string; // 'Asado', 'Rostizado'
  isActive: boolean;
  sortOrder?: number;
}

const StyleSchema = new Schema<IStyle>(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Style ||
  mongoose.model<IStyle>('Style', StyleSchema);

