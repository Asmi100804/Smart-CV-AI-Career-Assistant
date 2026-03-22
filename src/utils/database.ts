import mongoose from 'mongoose';

import { AppError } from './errors';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new AppError('MONGO_URI is missing in environment variables.', 500);
  }

  await mongoose.connect(mongoUri);
};
