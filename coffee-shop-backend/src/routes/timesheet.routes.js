const express = require('express');
const router = express.Router();
const timesheetController = require('../controllers/timesheet.controller');

router.get('/', timesheetController.getTimesheets);
router.put('/:id', timesheetController.updateTimesheet);
router.post('/send-to-employee', timesheetController.sendToEmployee);
router.post('/employee-reply', timesheetController.employeeReply);
router.post('/submit-to-admin', timesheetController.submitToAdmin);

module.exports = router;
