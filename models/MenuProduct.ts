// models/MenuProduct.ts
import mongoose, { Schema, Types } from 'mongoose';

export interface IMenuProduct {
  _id?: Types.ObjectId;
  code: string; // 'pollo', 'medio_pollo', 'costillar_medio', 'costillar_normal', 'costillar_grande', 'lechon', 'alitas', etc.
  name: string; // 'Pollo completo', '1/2 Pollo', etc.
  description?: string;
  price: number; // Precio base pickup
  isActive: boolean;
  availableFlavors: Types.ObjectId[]; // Referencias a Flavor
  availableStyles: Types.ObjectId[]; // Referencias a Style (solo para pollos)
  showOnlyInStore?: boolean; // Si es true, muestra alerta "solo bajo disponibilidad en tienda"
  sortOrder?: number; // Para ordenar en el menú
}

const MenuProductSchema = new Schema<IMenuProduct>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    availableFlavors: [{ type: Schema.Types.ObjectId, ref: 'Flavor' }],
    availableStyles: [{ type: Schema.Types.ObjectId, ref: 'Style' }],
    showOnlyInStore: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.MenuProduct ||
  mongoose.model<IMenuProduct>('MenuProduct', MenuProductSchema);

