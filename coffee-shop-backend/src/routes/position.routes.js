const express = require('express');
const router = express.Router();
const positionController = require('../controllers/position.controller');

// CRUD endpoints cho chucvu
router.get('/', positionController.getPositions);

module.exports = router;
