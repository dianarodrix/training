module.exports.mongoDbSettings = {
  Settings: {
    host: 'cluster0-shard-00-00.ampj6.mongodb.net,cluster0-shard-00-01.ampj6.mongodb.net,cluster0-shard-00-02.ampj6.mongodb.net',
    port: 27017,
    database: 'test',
    user: 'jacko',
    password: 'gj414bDXPeq4fBIt',
    ssl: true,
    authSource: 'admin',
  },
};
module.exports.redisSettings = {
  settings: {
    prefix: '_cache',
    host: '172.20.0.4',
    port: 6379,
    // password: '****'
  },
  keyName: 'test:condorlabs-npm-helpers:counter',
};
