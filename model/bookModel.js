const mongodb = require('@condor-labs/mongodb')();

const bookSchema = mongodb.mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    type: String,
    required: true,
  },
  pages: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['LENT', 'AVAILABLE', 'UNAVAILABLE'],
  },
});

const bookModel = mongodb.mongoose.model('Books', bookSchema);

module.exports = bookModel;
