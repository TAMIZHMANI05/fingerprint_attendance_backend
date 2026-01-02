const express = require('express');

const apiController = require('../controller/apiController');

const router = express.Router();

router.route('/self').get(apiController.self);
router.route('/health').get(apiController.health);

module.exports = router;
