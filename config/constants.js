require('dotenv').config();

module.exports.mongoDbSettings = {
  Settings: {
    host: `${process.env.MONGODB_HOSTNAME}`,
    port: `${process.env.MONGODB_PORT}`,
    database: `${process.env.MONGODB_DB}`,
    user: `${process.env.MONGODB_USERNAME}`,
    password: `${process.env.MONGODB_PASSWORD}`,
    ssl: true,
    authSource: 'admin',
  },
};

module.exports.redisSettings = {
  settings: {
    prefix: '_cache',
    host: `${process.env.REDIS_HOSTNAME}`,
    port: `${process.env.REDIS_PORT}`,
  },
  keyName: 'test:condorlabs-npm-helpers:counter',
};
