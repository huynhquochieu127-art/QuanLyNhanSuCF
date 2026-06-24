const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');

router.get('/reports', payrollController.getReports);
router.post('/calculate', payrollController.calculatePayroll);
router.post('/approve', payrollController.approvePayroll);
router.get('/me/:employeeId', payrollController.getPayslip);

module.exports = router;
