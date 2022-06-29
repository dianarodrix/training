const router = require('express').Router();
const Joi = require('joi');
const validator = require('express-joi-validation').createValidator({});
const bookController = require('../controller/bookController');

const bookSearch = Joi.object({
  title: Joi.string().optional(),
  author: Joi.string().optional(),
  pages: Joi.number().optional().min(0),
  status: Joi.string().optional().valid('LENT', 'AVAILABLE', 'UNAVAILABLE'),
});
const bookCreate = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  pages: Joi.number().required().min(0),
  status: Joi.string().required().valid('LENT', 'AVAILABLE', 'UNAVAILABLE'),
});
/**
 * List books
 *
 */
router.get('/', bookController.bookList);

/**
 * Get book’s details
 */
router.get('/search', validator.query(bookSearch), bookController.bookDetail);

/**
 * Create a book
 */
router.post('/', validator.body(bookCreate), bookController.bookCreate);

/**
 * Update a book
 */
router.put('/:id', validator.query(bookSearch), bookController.bookUpdate);

/**
 * Delete a book
 */
router.delete('/:id', bookController.bookDelete);

module.exports = router;
