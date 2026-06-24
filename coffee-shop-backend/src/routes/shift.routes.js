const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');

// QUAN TRONG: Routes cu the phai dat TRUOC routes co tham so (:id)

// --- Cài đặt (cauhinh) ---
router.get('/settings', shiftController.getSettings);
router.post('/settings', shiftController.updateSetting);

// --- Phân ca (phancanhanvien) ---
router.get('/schedule', shiftController.getSchedule);
router.post('/assign', shiftController.assignShift);
router.delete('/assign/:id', shiftController.removeAssignment);

// --- Đăng ký ca (dangky_ca) ---
router.get('/registrations', shiftController.getShiftRegistrations);
router.post('/register', shiftController.registerShift);
router.delete('/register/:id', shiftController.cancelRegistration);
router.put('/register/:id/status', shiftController.updateRegistrationStatus);

// --- Trạng thái tuần (trangthai_tuan) ---
router.get('/week-status/:week', shiftController.getWeekStatus);
router.put('/week-status/:week', shiftController.updateWeekStatus);
router.post('/finalize-week/:week', shiftController.finalizeWeek);

// --- Quản lý ca làm (calam) ---
router.get('/', shiftController.getShifts);
router.post('/', shiftController.createShift);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

module.exports = router;
