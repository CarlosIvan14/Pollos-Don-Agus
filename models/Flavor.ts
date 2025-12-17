// models/Flavor.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface IFlavor {
  _id?: Types.ObjectId;
  name: string; // 'Sinaloa (Natural)', 'BBQ', etc.
  price: number; // Precio adicional del sabor (puede ser 0)
  isActive: boolean;
  sortOrder?: number;
}

const FlavorSchema = new Schema<IFlavor>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Flavor ||
  mongoose.model<IFlavor>('Flavor', FlavorSchema);

