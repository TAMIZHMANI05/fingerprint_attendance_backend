const { totalmem, loadavg, freemem } = require('os');
const config = require('../configs/config');
const mongoose = require('mongoose');

module.exports = {
    getSystemHealth: () => {
        return {
            cpuUsage: loadavg(),
            totalMemory: `${(totalmem() / 1024 / 1024).toFixed(2)} MB`,
            freeMemory: `${(freemem() / 1024 / 1024).toFixed(2)} MB`
        };
    },
    getApplicationHealth: () => {
        return {
            environment: config.ENV,
            uptime: `${process.uptime().toFixed(2)} Seconds`,
            memoryUsage: {
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
            }
        };
    },
    getDBHealth: async () => {
        const dbState = mongoose.connection.readyState;
        const status = {
            uptime: process.uptime(),
            message: 'OK',
            timestamp: Date.now(),
            database: {
                status: mongoose.STATES[dbState],
                code: dbState
            }
        };

        if (dbState !== 1) {
            // Mongoose readyState 1 means connected
            status.message = 'Database Disconnected';
            return status;
        } else {
            return status;
        }
    }
};
