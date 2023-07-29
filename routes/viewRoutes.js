const viewsController = require('./../controllers/viewsController');
const express = require('express');
const authController = require('./../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.get('/', (req, res) => {
//     res.status(200).render('base', {
//       tour: 'The Forest Hiker',
//       user: 'Jonas'
//       // these variables that are passed to the pug called local in pug
//     });
// });

  
router.get('/tour/:slug', authController.isLoggedIn,  viewsController.getTour);
router.get('/login', authController.isLoggedIn,  viewsController.getLoginForm);
router.get('/signup',  viewsController.getSigninForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.get(
    '/', 
    bookingController.createBookingCheckout, 
    authController.isLoggedIn,  
    viewsController.getOverview
);

router.post(
    '/submit-user-data', 
    authController.protect, 
    viewsController.updateUserData
    );

module.exports = router;