const express = require('express');
const { scanPass, getLogs, verifyOtpAndCheckIn } = require('../controllers/checkLog.controller.js');
const { protect, authorize } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.use(protect);

router.post('/scan', authorize('Admin', 'Security'), scanPass);
router.post('/verify-otp', authorize('Admin', 'Security'), verifyOtpAndCheckIn);
router.get('/', authorize('Admin', 'Security'), getLogs);

module.exports = router;
