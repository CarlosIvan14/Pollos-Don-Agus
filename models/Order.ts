import mongoose, { Schema, Types } from 'mongoose';

const ItemSchema = new Schema({
  kind: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  flavor: { type: String },
  chickenStyle: { type: String, enum: ['asado','rostizado'], required: false },
  overridePrice: { type: Number },
});

const OrderSchema = new Schema({
  source: { type: String, enum: ['cliente','caja'], required: true },
  items: { type: [ItemSchema], required: true },
  delivery: { type: Boolean, default: false },
  tortillasPacks: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pendiente','confirmado','en_ruta','entregado','cancelado'], default: 'pendiente' },
  customer: {
    name: String,
    phone: String,
    addressNote: String,
    geo: { lat: Number, lng: Number },
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
