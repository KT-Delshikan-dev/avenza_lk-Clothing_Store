const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Auth Routes
 */

const { upload, handleMulterError } = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me-social', authController.meSocial);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, upload.single('profileImage'), handleMulterError, authController.updateProfile);
router.delete('/profile', protect, authController.deleteAccount);

module.exports = router;
