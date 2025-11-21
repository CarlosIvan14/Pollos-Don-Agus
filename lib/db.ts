import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pollos-don-agus';

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

if (!global.mongooseConn) {
  global.mongooseConn = { conn: null, promise: null };
}

export async function dbConnect() {
  if (global.mongooseConn.conn) return global.mongooseConn.conn;
  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose.connect(MONGODB_URI, { dbName: 'pollos-don-agus' });
  }
  global.mongooseConn.conn = await global.mongooseConn.promise;
  return global.mongooseConn.conn;
}
