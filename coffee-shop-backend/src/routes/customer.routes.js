const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

router.get('/', customerController.getCustomers);
router.post('/find-or-create', customerController.findOrCreateCustomer);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
