import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { setupSocket } from './socket';
import dynamicRoutes from './routes/dynamic';
import videoRoutes from './routes/videos';

// Initialize env
dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = setupSocket(server);
// Make io accessible in routes if needed via app.locals or passing it down
app.locals.io = io;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamic Generic Route logic
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1', dynamicRoutes(io));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iagrin';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
  });
