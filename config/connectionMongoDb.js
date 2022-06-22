const mongo = require('./constants');
const mongodb = require('@condor-labs/mongodb')(mongo.mongoDbSettings.Settings, { useNewUrlParser: true });

async function connect() {
  // connect to Mongo
  await mongodb.getClient();
  console.log(`isConnected(after): ${mongodb._isConnected()}`);
}

module.exports = connect();
