const bookModel = require('../model/bookModel');
const logger = require('@condor-labs/logger');

const { redisSettings } = require('../config/constants');
let client = {};
try {
  const redis = require('@condor-labs/redis')(redisSettings.settings);
  (async () => {
    // get client
    client = await redis.getClient();
    // prepare and execute batch in redis
    const redisBatch = client.batch();
    await redisBatch.incr(redisSettings.keyName);
    await redisBatch.expire(redisSettings.keyName, 1);
    const resolve = await redisBatch.execAsync();
    // validate response
    logger.info(
      resolve && resolve.length > 0 && resolve[0] > 0
        ? `REDIS Client connected OK!!!`
        : `REDIS Client connection failed :(`
    );
    // close app
    // process.exit(1);
  })();
} catch (error) {
  logger.error({ date: Date.now(), error: error });
}

// Display list of all books.
exports.bookList = async function (req, res) {
  try {
    // Check the redis store for the data first
    client.get('books', async (err, data) => {
      if (data) {
        res.status(200).send({
          message: `Data from the cache`,
          data: JSON.parse(data),
        });
      } else {
        const bookList = await bookModel.find();
        // save in cache
        client.setex('books', 1440, JSON.stringify(bookList));
        res.status(200).send(bookList);
      }
    });
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
  }
};

exports.bookDetail = async function (req, res) {
  const { id } = req.params;
  try {
    const book = await bookModel.findOne({ _id: id });
    if (!book) {
      res.status(404).send({ message: 'Book not found' });
    } else {
      res.status(200).send(book);
    }
  } catch (error) {
    // console.log(error)
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
};

exports.bookCreate = async function (req, res) {
  const newBook = new bookModel(req.body);

  try {
    const bookExist = await bookModel.findOne({ title: newBook.title });
    if (bookExist) {
      res.status(409).send({ message: 'Book already exist' });
    } else {
      const data = await bookModel.create(req.body);
      // console.log(data)
      await data.save().then(function () {
        client.del('books');
        res.status(201).send({ message: 'Book created' });
      });
    }
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      res.status(400).send(errors);
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
};

exports.bookUpdate = async function (req, res) {
  const { id } = req.params;
  const newDataBook = req.body;
  try {
    const bookExist = await bookModel.findOne({ _id: id });
    if (!bookExist) {
      res.status(400).send({ message: 'Book does not exist' });
    } else {
      await bookModel.updateOne({ _id: id }, { $set: newDataBook }, { runValidators: true }).then(function () {
        client.del('books');
        res.status(202).send({ message: 'Book updated' });
      });
    }
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      res.status(409).send(errors);
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
};

exports.bookDelete = async function (req, res) {
  const { id } = req.params;
  try {
    const bookExist = await bookModel.findOne({ _id: id });
    if (!bookExist) {
      res.status(404).send({ message: 'Book does not exist' });
    } else {
      await bookModel.deleteOne({ _id: id }).then(function () {
        client.del('books');
        res.status(201).send({ message: 'Book deleted successfully' });
      });
    }
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
};
