import http from 'http';
import mongoose from 'mongoose';
import { app } from './app/app';
import { env } from './config/env';
import { connectDatabase } from './config/database';

const server = http.createServer(app);

const start = async (): Promise<void> => {
  await connectDatabase(env.MONGO_URI);

  server.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`OpenAPI docs at http://localhost:${env.PORT}/docs`);
  });
};

start().catch((error: Error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
