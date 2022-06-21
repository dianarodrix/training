const router = require('express').Router();
const bookModel = require('../model/bookModel');
const logger = require('@condor-labs/logger');

const { redisSettings } = require('../config/constants');
let client = {}
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
    console.log((resolve && resolve.length > 0 && resolve[0] > 0) ? `REDIS Client connected OK!!!` : `REDIS Client connection failed :(`);
    // close app
    // process.exit(1);
  })();
} catch (error) {
  logger.error({ date: Date.now(), error: error });
}

/**  
 * List books
 * 
*/

router.get('/', async function (req, res) {
  try {
    // Check the redis store for the data first
    client.get("books", async (err, data) => {
      if (data) {
        return res.status(200).send({
          message: `Data from the cache`,
          data: JSON.parse(data)
        })
      } else {
        const bookList = await bookModel.find();
        // save in cache 
        client.setex("books", 1440, JSON.stringify(bookList));
        res.status(200).send(bookList);
      }
    });
  } catch (error) {
    console.log(error);
  }
});

/**  
 * Get book’s details
*/
router.get('/:id', async function (req, res) {
  const { id } = req.params;
  try {
    const book = await bookModel.findOne({ _id: id });
    if (!book) { return res.status(400).send({ message: 'Book not found' }); }
    res.status(200).send(book);
  } catch (error) {
    // console.log(error)
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
});

/**  
 * Create a book
*/
router.post('/', async function (req, res) {
  const newBook = new bookModel(req.body);

  try {
    const bookExist = await bookModel.findOne({ title: newBook.title });
    if (bookExist) {
      res.status(200).send({ message: 'Book already exist' });
    } else {
      const data = await bookModel.create(req.body);
      // console.log(data)
      await data.save()
        .then(function () {
          client.del("books");
          res.status(200).send({ message: "Book created" });
        });
    }
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      res.status(400).send(errors);
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
});

/**  
 * Update a book
*/
router.put('/:id', async function (req, res) {
  const { id } = req.params;
  const newDataBook = req.body;
  try {
    const bookExist = await bookModel.findOne({ _id: id });
    if (!bookExist) {
      res.status(400).send({ message: 'Book do not exist' });
    }

    await bookModel.updateOne(
      { _id: id },
      { $set: newDataBook },
      { runValidators: true }
    )
      .then(function () {
        client.del("books");
        res.status(200).send({ message: "Book updated" });
      });

  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      res.status(400).send(errors);
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
});

/**  
 * Delete a book
*/
router.delete('/:id', async function (req, res) {
  const { id } = req.params;
  try {
    const bookExist = await bookModel.findOne({ _id: id });
    if (!bookExist) {
      res.status(400).send({ message: 'Book do not exist' });
    } else {
      await bookModel
        .deleteOne({ _id: id })
        .then(function () {
          client.del("books");
          res.status(200).send({ message: 'Book deleted successfully' });
        })
    }
  } catch (error) {
    logger.error({ date: Date.now(), error: error });
    if (error.name === 'CastError') {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'Something went wrong' });
    }
  }
});

module.exports = router;