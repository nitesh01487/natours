const express = require('express');
const userController = require('../controllers/userController');
const authController = require('./../controllers/authController');

// images are not uploaded to the databases directly they are just kept in the file and the link of the img is stored in the database

const router = express.Router();

// whereas this is strict route
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
    '/updateMe', 
    userController.uploadUserPhoto, 
    userController.resizeUserPhoto, 
    userController.updateMe
    );
router.delete('/deleteMe', userController.deleteMe); // we actually mark them inactive

router.use(authController.restrictTo('admin'));

// these are routes in rest format and don't require strict route to match
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