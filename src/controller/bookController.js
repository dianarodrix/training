const bookModel = require('../model/bookModel');
const logger = require('@condor-labs/logger');

const { redisSettings } = require('../../config/constants');
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

/**
 * Books list
 * @param {*} req
 * @param {*} res
 */
exports.bookList = async function (req, res) {
  const offset = req.query.offset && req.query.offset >= 0 ? parseInt(req.query.offset, 10) : 0;
  const limit = req.query.limit && req.query.limit >= 1 && req.query.limit <= 100 ? parseInt(req.query.limit, 10) : 25;
  let bookList = {};
  const bookResp = {
    href: req.originalUrl.replace(/\?.*$/, ''),
    offset: offset,
    limit: limit,
    size: 0,
    items: [],
  };
  try {
    // Check the redis store for the data first
    client.del('books');
    client.get('books', async (err, data) => {
      if (data) {
        bookList = JSON.parse(data);
        bookResp.items = bookList.slice(offset, offset + limit);
      } else {
        bookList = await bookModel.find().sort({ title: 1 });
        // save in cache
        client.setex('books', 1440, JSON.stringify(bookList));
        bookResp.items = bookList.slice(offset, offset + limit);
      }
      bookResp.size = bookResp.items.length;
      res.status(200).send(bookResp);
    });
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
  }
};

/**
 * Book Detail
 * @param {*} req
 * @param {*} res
 */
exports.bookDetail = async function (req, res) {
  const q = req.query;
  try {
    client.get('books', async (err, data) => {
      if (data) {
        const keys = Object.keys(q);
        const books = JSON.parse(data);
        const found = books.filter(function (item) {
          return keys.every((k) => {
            return item[k] === q[k];
          });
        });
        if (found.length > 0) {
          res.status(200).send(found);
        } else {
          res.status(404).send({ message: 'Book not found' });
        }
      } else {
        res.status(404).send({ message: 'Book not found!' });
      }
    });
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
  }
};

/**
 * Book Create
 * @param {*} req
 * @param {*} res
 */
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

/**
 * Book Update
 * @param {*} req
 * @param {*} res
 */
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

/**
 * Book Delete
 * @param {*} req
 * @param {*} res
 */
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
