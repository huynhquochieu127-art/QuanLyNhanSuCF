const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');

router.get('/me/:employeeId', payrollController.getPayslip);

module.exports = router;
