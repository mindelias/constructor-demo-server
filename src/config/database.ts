import mongoose, { ConnectOptions } from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const options: ConnectOptions = {
      // Options are now built into Mongoose 6+
    };

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/constructor_demo', options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${mongoose.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err: Error) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export default connectDB;