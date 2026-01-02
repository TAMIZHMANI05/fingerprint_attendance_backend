const { createLogger, transports, format } = require('winston');
const util = require('util');
const config = require('../configs/config');
const EApplicationEnvironment = require('../constants/application');
const path = require('path');

const consoleLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta } = info;
    const customLevel = level.toUpperCase();
    const customTimestamp = timestamp;
    const customMessage = message;
    const customMeta = util.inspect(meta, {
        showHidden: false,
        depth: null
    });

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const customLog = `${customLevel} [${customTimestamp}] ${customMessage}\n${'META'} ${customMeta}\n`;

    return customLog;
});

const fileLogFormat = format.printf((info) => {
    const { level, message, timestamp, meta = {} } = info;
    const logMeta = {};

    for (const [key, value] of Object.entries(meta)) {
        if (value instanceof Error) {
            logMeta[key] = {
                name: value.name,
                message: value.message,
                trace: value.stack || ''
            };
        } else {
            logMeta[key] = value;
        }
    }

    const logData = {
        level: level.toUpperCase(),
        message,
        timestamp,
        meta: logMeta
    };

    return JSON.stringify(logData, null, 4);
});

const consoleTransport = () => {
    if (config.ENV === EApplicationEnvironment.DEVELOPMENT) {
        return [
            new transports.Console({
                level: 'info',
                format: format.combine(format.timestamp(), consoleLogFormat)
            })
        ];
    }

    return [];
};

const FileTransport = () => {
    return [
        new transports.File({
            filename: path.join(__dirname, '../', '../', 'logs', `${config.ENV}.log`),
            level: 'info',
            format: format.combine(format.timestamp(), fileLogFormat)
        })
    ];
};

module.exports = createLogger({
    defaultMeta: {
        meta: {}
    },
    transports: [...FileTransport(), ...consoleTransport()]
});
