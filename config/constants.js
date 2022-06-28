require('dotenv').config();
module.exports.mongoDbSettings = {
  Settings: {
    host: `${process.env.MONGODB_HOST}`,
    port: `${process.env.MONGODB_PORT}`,
    database: `${process.env.MONGODB_DB}`,
    user: `${process.env.MONGODB_USER}`,
    password: `${process.env.MONGODB_PWD}`,
    ssl: true,
    authSource: 'admin',
  },
};

module.exports.redisSettings = {
  settings: {
    prefix: '_cache',
    host: `${process.env.REDIS_HOST}`,
    port: `${process.env.REDIS_PORT}`,
  },
  keyName: 'test:condorlabs-npm-helpers:counter',
};
