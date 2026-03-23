export type RedisConfig = {
  host: string;
  port: number;
};

export const redisConfig = () => ({
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT as string) ?? 6379,
  } satisfies RedisConfig,
});
