import app from './app';
import { connectDatabase } from './utils/database';

const port = Number(process.env.PORT ?? 4000);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
