const dotenvFlow = require('dotenv-flow');

dotenvFlow.config();

module.exports = {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    CLIENT_URL: process.env.CLIENT_URL
};
