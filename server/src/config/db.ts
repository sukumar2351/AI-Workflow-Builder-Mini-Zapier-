import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowgenius';
  
  try {
    console.log(`Connecting to MongoDB at: ${mongoURI.replace(/:([^@]+)@/, ':****@')}`); // Hide credentials in log
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
