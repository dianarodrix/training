const express = require('express');
const request = require('supertest');
const bookRoutes = require('../src/routes/bookRoutes');
const connect = require('../config/connectionMongoDb');

const PORT = 3000;
const app = express();
app.use(express.json());
app.use(async function (req, res, next) {
  await connect;
  next();
});
app.set('port', process.env.PORT || PORT);
app.use('/books', bookRoutes);

// status:  "LENT", "AVAILABLE", "UNAVAILABLE"
describe('POST /books', () => {
  describe('given required fields', () => {
    const newBook = {
      title: `some title-${Math.floor(Math.random() * 6)}`,
      author: 'some author',
      pages: 987,
      status: 'LENT',
    };

    // should respond with a 201 code
    test('should respond with a 201 status code', async () => {
      const response = await request(app).post('/books').send(newBook);
      expect(response.statusCode).toBe(201);
    });

    // should respond a json as a content type
    test('should have a Content-Type: application/json header', async () => {
      const response = await request(app).post('/books').send(newBook);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
    });

    // shoud respond with a json object containing the confirmation message
    test('should respond with an message', async () => {
      const response = await request(app).post('/books').send(newBook);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('when one or more fields is missing', () => {
    // should respond with a 400 code
    test('shoud respond with a 400 status code', async () => {
      const fields = [{ title: `some title${Math.floor(Math.random() * 6)}` }, { author: 'some author' }];

      const response = await request(app).post('/books').send(fields);
      expect(response.statusCode).toBe(400);
    });
  });
});
