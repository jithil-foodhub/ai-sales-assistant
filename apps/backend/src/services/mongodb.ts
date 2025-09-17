import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

class MongoDBService {
  private static instance: MongoDBService;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📊 MongoDB already connected');
      return;
    }

    try {
      const mongoHost = process.env.MONGO_HOST;
      if (!mongoHost) {
        throw new Error('MONGO_HOST environment variable is not set');
      }

      console.log(`🔌 Connecting to MongoDB at ${mongoHost}...`);
      
      await mongoose.connect(mongoHost, {
        // Remove deprecated options for newer mongoose versions
      });

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 MongoDB disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionInfo() {
    return {
      isConnected: this.getConnectionStatus(),
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

export const mongoDBService = MongoDBService.getInstance();
