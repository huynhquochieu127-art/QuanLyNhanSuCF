const express = require('express');
const router = express.Router();
const timekeepingController = require('../controllers/timekeeping.controller');

router.get('/', timekeepingController.getAttendanceHistory);
router.post('/checkin', timekeepingController.checkIn);
router.post('/checkout', timekeepingController.checkOut);
router.get('/today-status', timekeepingController.getTodayStatus);
router.get('/requests', timekeepingController.getRequests);
router.post('/request', timekeepingController.submitRequest);
router.put('/request/:id/status', timekeepingController.updateRequestStatus);
router.get('/leave', timekeepingController.getLeaveRequests);
router.put('/leave/:id/status', timekeepingController.updateLeaveRequestStatus);
router.get('/scheduled-shifts', timekeepingController.getScheduledShifts);

module.exports = router;
