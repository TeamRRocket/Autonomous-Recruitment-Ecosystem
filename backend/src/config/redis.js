import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  // Intentionally throw early so timer logic never silently falls back to memory.
  throw new Error('REDIS_URL is not set. Add REDIS_URL to backend/.env');
}

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

let connectPromise;
export const ensureRedisConnected = async () => {
  if (redis.isOpen) return;
  if (!connectPromise) {
    connectPromise = redis.connect();
  }
  await connectPromise;
};
