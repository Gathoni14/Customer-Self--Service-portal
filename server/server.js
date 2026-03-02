import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import configurations
import { connectDB } from './src/config/database.js';
import { connectRedis } from './src/config/redis.js';
import { logger } from './src/utils/logger.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import trackingRoutes from './src/routes/tracking.routes.js';
import supportRoutes from './src/routes/support.routes.js';
import returnRoutes from './src/routes/return.routes.js';
import profileRoutes from './src/routes/profile.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { authenticate } from './src/middleware/auth.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/tracking', trackingRoutes); // Guest tracking doesn't require auth
app.use('/api/support', authenticate, supportRoutes);
app.use('/api/returns', authenticate, returnRoutes);
app.use('/api/profile', authenticate, profileRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('New WebSocket connection established');

  socket.on('subscribe_to_order', (orderId) => {
    socket.join(`order_${orderId}`);
    logger.info(`Client subscribed to order ${orderId}`);
  });

  socket.on('unsubscribe_from_order', (orderId) => {
    socket.leave(`order_${orderId}`);
    logger.info(`Client unsubscribed from order ${orderId}`);
  });

  socket.on('subscribe_to_user', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`Client subscribed to user ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info('WebSocket connection closed');
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 WebSocket server ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };