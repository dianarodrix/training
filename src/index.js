const express = require('express');
const settings = require('../config/constants');
const connect = require('../config/connectionMongoDb');
const { healthMonitor, dependencyServices } = require('@condor-labs/health-middleware');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const app = express();
const logger = require('@condor-labs/logger');
const healthConfig = {
  service: 'service demo',
  description: 'my service with some demo check',
  dependencies: [
    {
      service: dependencyServices.MONGODB,
      componentName: 'MyMongoDB',
      connection: settings.mongoDbSettings.Settings,
    },
    {
      service: dependencyServices.REDIS,
      componentName: 'CacheRedis',
      connection: settings.redisSettings.settings,
    },
  ],
};

const bookRoutes = require('./routes/bookRoutes');
const bookModel = require('./model/bookModel');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/bookSchema');
const resolvers = require('./schema/bookResolvers');

const SERVER = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    bookModel,
  },
  introspection: true,
  playground: {
    endpoint: `/graphql`,
    settings: {
      'editor.theme': 'dark',
    },
  },
});
app.use(express.json());

app.use(async function (req, res, next) {
  healthMonitor(app, healthConfig);
  next();
});

app.use(async function (req, res, next) {
  await connect;
  await SERVER.applyMiddleware({
    app,
  });
  next();
});

async function startServer() {
  app.set('port', PORT);

  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'HI!',
    });
  });
  app.use('/books', bookRoutes);
  app.listen(PORT, () => {
    logger.info(`App listening on port ${PORT}`);
  });
}

startServer();
