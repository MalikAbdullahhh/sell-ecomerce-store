import mongoose from "mongoose";

/**
 * Cached Mongo connection — required on Vercel serverless so cold starts
 * reuse the same pool instead of opening a new one every request.
 */
const globalForMongoose = globalThis;

export async function connectDB(uri) {
  if (!uri) throw new Error("MONGODB_URI is missing");

  mongoose.set("strictQuery", true);

  if (globalForMongoose.__apertureMongoose?.conn) {
    return globalForMongoose.__apertureMongoose.conn;
  }

  if (!globalForMongoose.__apertureMongoose) {
    globalForMongoose.__apertureMongoose = { conn: null, promise: null };
  }

  if (!globalForMongoose.__apertureMongoose.promise) {
    globalForMongoose.__apertureMongoose.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.name}`);
        return m;
      });
  }

  globalForMongoose.__apertureMongoose.conn = await globalForMongoose.__apertureMongoose.promise;
  return globalForMongoose.__apertureMongoose.conn;
}
