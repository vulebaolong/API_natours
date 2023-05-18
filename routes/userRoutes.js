const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// không cần đăng nhập
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//! những dòng mã chạy sau sẽ đều có protect, vì chạy theo thứ tự
router.use(authController.protect);
router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

//! những dòng mã chạy sau sẽ đều có protect và phải có quyền admin
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
