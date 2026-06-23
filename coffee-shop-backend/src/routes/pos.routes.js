const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');

router.post('/order', posController.createOrder);

module.exports = router;
