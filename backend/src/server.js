import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import Category from './models/Category.js';

const port = Number(process.env.PORT || 8000);

const ensureDefaultCategories = async () => {
  await Category.bulkWrite([
    {
      updateOne: {
        filter: { name: 'Full Video' },
        update: { $setOnInsert: { name: 'Full Video', default_rate: 250, description: 'Full-length video editing', is_active: true } },
        upsert: true,
      },
    },
    {
      updateOne: {
        filter: { name: 'Graphics/Text' },
        update: { $setOnInsert: { name: 'Graphics/Text', default_rate: 1000, description: 'Graphics and text editing', is_active: true } },
        upsert: true,
      },
    },
  ]);
};

const startServer = async () => {
  await connectDatabase();
  console.log('MongoDB connected');
  await ensureDefaultCategories();
  app.listen(port, () => console.log(`Ledger API listening on port ${port}`));
};

startServer().catch((error) => {
  console.error(`MongoDB connection failed: ${error.message}`);
  process.exit(1);
});
