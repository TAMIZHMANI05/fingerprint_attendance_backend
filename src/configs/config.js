const dotenvFlow = require('dotenv-flow');

dotenvFlow.config();

module.exports = {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SERVER_URL: process.env.SERVER_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    MQTT_BROKER_URL: process.env.MQTT_BROKER_URL,
    KIOSK_API_KEY: process.env.KIOSK_API_KEY
};

