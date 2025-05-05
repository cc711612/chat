export const envConfig = () => ({
  database: {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'chat_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    environment: process.env.NODE_ENV || 'development',
  },
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
});