
const typeDefs = `
    type Book {
        _id: String!
        title: String!
        author: String!
        pages: Int!
        status: String!
    }

    type Query {
        allBooks: [Book]
        bookDetail(_id:ID!): Book
    }

    type Mutation {
        Create(input: BookInput): Book,
        Update(_id: ID!, input: BookInput): Book,
        Delete(_id:ID!): Book
    }
    
    input BookInput {
        title: String
        author: String
        pages: Int
        status: String
    }
`;

module.exports = typeDefs;