const express = require('express');
const bookRoutes = require('../routes/bookRoutes');
const connect = require('../config/connectionMongoDb');
const { healthMonitor, dependencyServices, } = require("@condor-labs/health-middleware");

const settings = require('../config/constants');
const PORT = 3000;
const app = express();

const healthConfig = {
  service: "service demo",
  description: "my service with some demo check",
  dependencies: [
    {
      service: dependencyServices.MONGODB,
      componentName: "MyMongoDB",
      connection: settings.mongoDbSettings.Settings,
    },
    {
      service: dependencyServices.REDIS,
      componentName: "CacheRedis",
      connection: settings.redisSettings.settings,
    },
  ],
};

const bookModel = require('../model/bookModel');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('../model/schema');
const resolvers = require('../model/resolvers');

const SERVER = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    bookModel
  },
  introspection: true,
  playground: true,
  playground: {
    endpoint: `/graphql`,
    settings: {
      'editor.theme': 'dark'
    }
  }
})
app.use(express.json());

app.use(async function (req, res, next) {
  healthMonitor(app, healthConfig);
  next();
});

app.use(async function (req, res, next) {
  await connect;
  await SERVER.applyMiddleware({
    app
  });
  next();
});

app.set('port', process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.status(200).json({
    message: "HI!"
  });
});
app.use('/books', bookRoutes);

app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

