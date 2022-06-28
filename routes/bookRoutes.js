const router = require('express').Router();
const bookController = require('../controller/bookController');
/**
 * List books
 *
 */

router.get('/', bookController.bookList);

/**
 * Get book’s details
 */
router.get('/:id', bookController.bookDetail);

/**
 * Create a book
 */
router.post('/', bookController.bookCreate);

/**
 * Update a book
 */
router.put('/:id', bookController.bookUpdate);

/**
 * Delete a book
 */
router.delete('/:id', bookController.bookDelete);

module.exports = router;
