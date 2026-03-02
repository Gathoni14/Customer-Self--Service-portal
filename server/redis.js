import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};