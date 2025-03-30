import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Get Redis configuration from environment variables
const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,
} = process.env;

// Create Redis client
const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
  password: REDIS_PASSWORD,
});

// Handle connection
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

export { redisClient, connectRedis }; 