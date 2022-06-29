const bookModel = require('../model/bookModel');
const logger = require('@condor-labs/logger');

function findBook(data, q) {
  const keys = Object.keys(q);
  const books = JSON.parse(data);
  return books.filter(function (item) {
    return keys.every((k) => {
      return item[k] === q[k];
    });
  });
}

exports.getBooks = async function (client) {
  const bookList = await bookModel.find().sort({ title: 1 });
  client.setex('books', 1440, JSON.stringify(bookList));
  return bookList;
};

exports.getBookDetail = async function (res, client, q) {
  return client.get('books', async (err, data) => {
    if (data) {
      const found = await findBook(data, q);
      if (found.length > 0) {
        res.status(200).send(found);
      } else {
        res.status(404).send({ message: 'Book not found' });
      }
    } else {
      res.status(404).send({ message: 'Book not found!' });
    }
  });
};

exports.createBook = async function (res, client, q) {
  const newBook = new bookModel(q);

  try {
    const bookExist = await bookModel.findOne({ title: newBook.title });
    if (bookExist) {
      res.status(409).send({ message: 'Book already exist' });
    } else {
      const data = await bookModel.create(q);
      // console.log(data)
      await data.save().then(function () {});
      client.del('books');
      res.status(201).send({ message: 'Book created' });
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

exports.updateBook = async function (req, res, client) {
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

exports.deleteBook = async function (req, res, client) {
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
