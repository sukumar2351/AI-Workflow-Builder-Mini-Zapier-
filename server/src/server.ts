import app from './app';
import { connectDB } from './config/db';
import { seedDefaultTemplates } from './controllers/templateController';

const PORT = process.env.PORT || 5000;

const validateEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'GOOGLE_CALLBACK_URL', 'FRONTEND_URL'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`CRITICAL CONFIG ERROR: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(`WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth will not function.`);
  }
};

const startServer = async () => {
  // Validate env before listening
  validateEnv();

  // Listen on PORT first so Render port scan succeeds immediately
  app.listen(PORT, async () => {
    console.log(`==========================================`);
    console.log(`FlowGenius AI Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`==========================================`);

    try {
      // Connect to database in the background
      await connectDB();

      // Seed default templates
      await seedDefaultTemplates();
    } catch (error) {
      console.error('Failed to initialize database or seed templates:', error);
    }
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
