const httpResponse = require('../../utils/httpResponse');
const httpError = require('../../utils/httpError');
const responseMessage = require('../../constants/responseMessage');
const Device = require('./device.model');

// Create device (Admin only)
const createDevice = async (req, res, next) => {
    try {
        const { deviceId, name, department, year, section, model, firmwareVersion, maxFingerprints } = req.body;

        // Check if device already exists
        const existingDevice = await Device.findOne({ deviceId });
        if (existingDevice) {
            return httpError(next, new Error('Device ID already exists'), req, 400);
        }

        const device = await Device.create({
            deviceId,
            name,
            department,
            year,
            section,
            model,
            firmwareVersion,
            maxFingerprints
        });

        httpResponse(req, res, 201, responseMessage.DEVICE_CREATED, { device });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

// Get all devices with filters
const getDevices = async (req, res, next) => {
    try {
        const { department, year, section, isActive, isOnline, search, limit = 50, skip = 0 } = req.query;

        const filter = {};
        if (department) filter.department = department;
        if (year) filter.year = parseInt(year);
        if (section) filter.section = section;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (isOnline !== undefined) filter.isOnline = isOnline === 'true';
        if (search) {
            filter.$or = [{ deviceId: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
        }

        const devices = await Device.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).skip(parseInt(skip));

        const total = await Device.countDocuments(filter);

        httpResponse(req, res, 200, responseMessage.SUCCESS, {
            devices,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > parseInt(skip) + devices.length
            }
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

// Get single device
const getDevice = async (req, res, next) => {
    try {
        const { id } = req.params;

        const device = await Device.findById(id);
        if (!device) {
            return httpError(next, new Error('Device not found'), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, { device });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

// Update device
const updateDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating certain fields
        delete updates.enrolledCount;
        delete updates.isOnline;
        delete updates.lastSeen;

        // Check if deviceId is being changed and if it already exists
        if (updates.deviceId) {
            const existing = await Device.findOne({ deviceId: updates.deviceId, _id: { $ne: id } });
            if (existing) {
                return httpError(next, new Error('Device ID already exists'), req, 400);
            }
        }

        const device = await Device.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!device) {
            return httpError(next, new Error('Device not found'), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.DEVICE_UPDATED, { device });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

// Delete device
const deleteDevice = async (req, res, next) => {
    try {
        const { id } = req.params;

        const device = await Device.findByIdAndDelete(id);
        if (!device) {
            return httpError(next, new Error('Device not found'), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.DEVICE_DELETED, {
            deviceId: device.deviceId
        });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

// Update device status (online/offline, lastSeen) - called by MQTT/Socket handlers
const updateDeviceStatus = async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { isOnline, lastSeen } = req.body;

        const device = await Device.findOneAndUpdate(
            { deviceId },
            {
                isOnline: isOnline !== undefined ? isOnline : true,
                lastSeen: lastSeen || new Date()
            },
            { new: true }
        );

        if (!device) {
            return httpError(next, new Error('Device not found'), req, 404);
        }

        httpResponse(req, res, 200, responseMessage.SUCCESS, { device });
    } catch (error) {
        httpError(next, error, req, 500);
    }
};

module.exports = {
    createDevice,
    getDevices,
    getDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus
};

