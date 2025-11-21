import mongoose, { Schema } from 'mongoose';

export interface IInventoryItem {
  _id?: string;
  name: string;                // Ej. "Lata chiles chipotles 2½ kg"
  category: 'pollo' | 'aderezo' | 'envase' | 'combustible' | 'ingrediente' | 'otro';
  unit: string;                // Ej. "kg", "pieza", "lata", "paquete", "tercio"
  currentQty: number;          // Cantidad disponible
  minQty: number;              // Umbral para alerta
  maxQty?: number | null;      // Opcional: stock objetivo
  supplierName?: string;
  supplierPhone?: string;
  supplierNotes?: string;      // "Comprar en X tienda", etc.
  isActive: boolean;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['pollo', 'aderezo', 'envase', 'combustible', 'ingrediente', 'otro'],
      default: 'otro',
    },
    unit: { type: String, required: true, trim: true },
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

export default mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
