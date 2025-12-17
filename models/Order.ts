import mongoose, { Schema, Types } from 'mongoose';

const ItemSchema = new Schema({
  kind: { type: String, required: true }, // Código del producto: 'pollo', 'medio_pollo', etc.
  qty: { type: Number, required: true, min: 1 },
  flavor: { type: String }, // Nombre del sabor 
  flavorId: { type: Schema.Types.ObjectId, ref: 'Flavor' }, // Referencia al sabor
  styleId: { type: Schema.Types.ObjectId, ref: 'Style' }, // Referencia al estilo
  overridePrice: { type: Number }, // Precio override si se necesita
  productId: { type: Schema.Types.ObjectId, ref: 'MenuProduct' }, // Referencia al producto del menú
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
    desiredAt: String, 
  },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
