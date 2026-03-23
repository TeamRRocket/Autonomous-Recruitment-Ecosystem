import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

// Check if Redis is disabled
const isRedisDisabled = !REDIS_URL || REDIS_URL.toLowerCase() === 'disabled';

let redis;
let connectPromise;

if (isRedisDisabled) {
  console.log('⚠️  Redis is disabled. Using in-memory storage for cache operations.');
  
  // In-memory storage for mock Redis
  const storage = new Map();
  const hashStorage = new Map();
  
  // Create a mock Redis client with full feature set
  redis = {
    isOpen: false,
    connect: async () => { console.log('Redis is disabled - using in-memory storage'); },
    get: async (key) => storage.get(key) || null,
    /** Batch get (node-redis mGet) — required by DSA getStatus when Redis is disabled */
    mGet: async (keys) => {
      if (!Array.isArray(keys)) return [];
      return keys.map((k) => storage.get(k) ?? null);
    },
    set: async (key, value, options) => {
      if (options?.NX && storage.has(key)) return null;
      storage.set(key, value);
      return 'OK';
    },
    del: async (key) => { 
      const existed = storage.has(key);
      storage.delete(key); 
      hashStorage.delete(key);
      return existed ? 1 : 0; 
    },
    expire: async (key, seconds, mode) => { 
      // In-memory mock doesn't implement TTL, just return success
      return 1; 
    },
    keys: async (pattern) => {
      // Simple pattern matching (only supports '*')
      if (pattern === '*') return Array.from(storage.keys());
      return [];
    },
    // Hash operations
    hSet: async (key, field, value) => {
      if (!hashStorage.has(key)) {
        hashStorage.set(key, new Map());
      }
      const hash = hashStorage.get(key);
      const isNew = !hash.has(field);
      hash.set(field, value);
      return isNew ? 1 : 0;
    },
    hGet: async (key, field) => {
      const hash = hashStorage.get(key);
      return hash ? (hash.get(field) || null) : null;
    },
    hGetAll: async (key) => {
      const hash = hashStorage.get(key);
      if (!hash) return {};
      const result = {};
      for (const [field, value] of hash.entries()) {
        result[field] = value;
      }
      return result;
    },
    hDel: async (key, field) => {
      const hash = hashStorage.get(key);
      if (!hash) return 0;
      const existed = hash.has(field);
      hash.delete(field);
      return existed ? 1 : 0;
    },
    // Transaction support
    multi: () => {
      const commands = [];
      return {
        incr: (key) => {
          commands.push({ cmd: 'incr', key });
          return this;
        },
        expire: (key, seconds, mode) => {
          commands.push({ cmd: 'expire', key, seconds, mode });
          return this;
        },
        exec: async () => {
          const results = [];
          for (const { cmd, key, seconds } of commands) {
            if (cmd === 'incr') {
              const current = parseInt(storage.get(key) || '0', 10);
              const newValue = current + 1;
              storage.set(key, String(newValue));
              results.push(newValue);
            } else if (cmd === 'expire') {
              // Mock doesn't implement TTL, just return success
              results.push(1);
            }
          }
          return results;
        }
      };
    },
    quit: async () => { 
      storage.clear(); 
      hashStorage.clear();
    },
    on: () => {},
  };
} else {
  redis = createClient({ url: REDIS_URL });

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });
}

export { redis };

export const ensureRedisConnected = async () => {
  if (isRedisDisabled) return;
  if (redis.isOpen) return;
  if (!connectPromise) {
    connectPromise = redis.connect();
  }
  await connectPromise;
};
