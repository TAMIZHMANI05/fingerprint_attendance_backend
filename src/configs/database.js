const mongoose = require('mongoose');
const config = require('./config');

module.exports = {
    connect: async () => {
        try {
            await mongoose.connect(config.DATABASE_URL)
            return mongoose.connection
        } catch (err) {
            throw err
        }
    }
}