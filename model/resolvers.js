
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
        console.log((resolve && resolve.length > 0 && resolve[0] > 0) ?
            `REDIS - GRAPHQL Client connected OK!!!` : `REDIS Client connection failed :(`);
        // close app
        // process.exit(1);
    })();
} catch (error) {
    logger.error({ date: Date.now(), error: error });
}

const resolvers = {
    Query: {
        allBooks: async (_, args) => {
            const bookList = await bookModel.find();
            // console.log(bookList)
            // save in cache 
            client.setex("books", 1440, JSON.stringify(bookList));
            return JSON.parse(JSON.stringify(bookList));
        },
        bookDetail: async (_, { _id }) => {
            console.log(_id)
            const bookExist = await bookModel.findOne({ _id: _id });
            return bookExist
        }
    },
    Mutation: {
        Create: async (_, { input }) => {
            console.log(input)
            const newBook = await new bookModel(input).save();
            return newBook;
        },
        Update: async (_, { _id, input }) => {
            const book = await bookModel
                .findOneAndUpdate(
                    { _id: _id },
                    { $set: input },
                    { new: true, runValidators: true }
                )
                .then((bookData) => {
                    if (bookData) {
                        client.del("books");
                        return bookData
                    } else {
                        return { success: false, data: "no such exist" };
                    }
                }).catch((err) => {
                    logger.error({ date: new Date(), error: err });
                })
            return book;
        },
        Delete: async (_, { _id }) => {
            const book = await bookModel
                .findOneAndDelete(
                    { _id: _id },
                    { runValidators: true }
                )
                .then((bookData) => {
                    if (bookData) {
                        client.del("books");
                    }
                }).catch((err) => {
                    logger.error({ date: new Date(), error: err });
                })
            return book;
        }
    }
}
module.exports = resolvers;