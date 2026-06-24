const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');

router.get('/', discountController.getDiscounts);
router.get('/validate/:code', discountController.validateDiscount);
router.post('/', discountController.createDiscount);
router.put('/:id', discountController.updateDiscount);
router.put('/:id/toggle', discountController.toggleDiscount);
router.delete('/:id', discountController.deleteDiscount);

module.exports = router;
