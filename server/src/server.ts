import app from './app';
import { connectDB } from './config/db';
import { seedDefaultTemplates } from './controllers/templateController';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Seed default templates
  await seedDefaultTemplates();

  // Listen on PORT
  app.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`FlowGenius AI Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`==========================================`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
