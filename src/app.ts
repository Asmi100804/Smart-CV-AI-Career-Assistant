import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import testRoutes from './routes/test.routes';
import { errorHandler, notFoundHandler } from './utils/errorHandler';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/test', testRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
