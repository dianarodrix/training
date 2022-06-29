const { getBooks, getBookDetail, createBook, updateBook, deleteBook } = require('../services/bookServices');

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
    // client.del('books');
    client.get('books', async (err, data) => {
      if (data) {
        bookList = JSON.parse(data);
        bookResp.items = bookList.slice(offset, offset + limit);
      } else {
        bookList = await getBooks(client);
        bookResp.items = bookList.slice(offset, offset + limit);
      }
      bookResp.size = bookResp.items.length;
      res.status(200).send(bookResp);
    });
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    res.status(500).send({ message: 'Something went wrong' });
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
    return await getBookDetail(res, client, q);
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    res.status(500).send({ message: 'Something went wrong' });
  }
};

/**
 * Book Create
 * @param {*} req
 * @param {*} res
 */
exports.bookCreate = async function (req, res) {
  const q = req.body;
  return await createBook(res, client, q);
};

/**
 * Book Update
 * @param {*} req
 * @param {*} res
 */
exports.bookUpdate = async function (req, res) {
  return await updateBook(req, res, client);
};

/**
 * Book Delete
 * @param {*} req
 * @param {*} res
 */
exports.bookDelete = async function (req, res) {
  return await deleteBook(req, res, client);
};
