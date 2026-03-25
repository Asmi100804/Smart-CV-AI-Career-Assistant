import { createApp } from "./app.js";
import { connectDatabase } from "./utils/db.js";

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI is required");
}

await connectDatabase(mongoUri);

createApp().listen(port, () => {
  console.log(`Mock test API running on ${port}`);
});
