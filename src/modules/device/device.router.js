const express = require('express');
const { createDevice, getDevices, getDevice, updateDevice, deleteDevice, updateDeviceStatus } = require('./device.controller');
const { verifyToken, requireRole } = require('../../middlewares/auth');

const router = express.Router();

// All device routes require authentication and admin role
router.use(verifyToken, requireRole(['admin']));

// CRUD routes
router.post('/', createDevice);
router.get('/', getDevices);
router.get('/:id', getDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

// Status update route (for MQTT/Socket handlers)
router.patch('/:deviceId/status', updateDeviceStatus);

module.exports = router;

