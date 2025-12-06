// models/Product.ts
import mongoose, { Schema } from 'mongoose';

export interface IProduct {
  _id?: string;
  code: string; // ej. "pollo_crudo", ""
  name: string; // ej. "Pollo crudo entero"
  category: 'pollo' | 'aderezo' | 'costillar' | 'envase' | 'combustible' | 'ingrediente' | 'otro';
  unit: string;       // "kg", "pieza", "l", "g", "paquete", etc.
  step: number;       // paso mínimo: 0.25, 0.5, 1, 2.5, 0.1, etc.
  currentQty: number;
  minQty: number;
  maxQty?: number | null;
  supplierName?: string;
  supplierPhone?: string;
  supplierNotes?: string;
  isActive: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['pollo', 'aderezo','costillar', 'envase', 'combustible', 'ingrediente', 'otro'],
      default: 'otro',
    },
    unit: { type: String, required: true, trim: true },

    // 👇 NUEVO: paso de movimiento
    step: {
      type: Number,
      required: true,
      min: 0.001,
      default: 1,
    },

    currentQty: { type: Number, required: true, min: 0 },
    minQty: { type: Number, required: true, min: 0 },
    maxQty: { type: Number, default: null },
    supplierName: { type: String },
    supplierPhone: { type: String },
    supplierNotes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);
