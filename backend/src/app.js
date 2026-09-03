import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') ?? '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR ?? 'uploads')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);

export default app;