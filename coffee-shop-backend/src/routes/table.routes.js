const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');

router.get('/', tableController.getTables);
router.put('/:id/status', tableController.updateTableStatus);

module.exports = router;
