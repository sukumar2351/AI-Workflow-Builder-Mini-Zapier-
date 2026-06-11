import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import workflowRoutes from './routes/workflowRoutes';
import logRoutes from './routes/logRoutes';
import templateRoutes from './routes/templateRoutes';
import webhookRoutes from './routes/webhookRoutes';

// Import middlewares
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP restriction if testing frontend locally on different port
}));

// CORS Configuration
app.use(cors({
  origin: true, // Allow all origins for dev simplicity, or configure specific port like http://localhost:5173
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs for general dev/testing
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});
app.use('/api/', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler as any);

export default app;
