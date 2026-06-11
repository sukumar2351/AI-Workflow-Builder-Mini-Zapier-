import app from './app';
import { connectDB } from './config/db';
import { seedDefaultTemplates } from './controllers/templateController';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
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
