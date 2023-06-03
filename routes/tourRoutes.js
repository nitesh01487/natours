const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');

const reviewRouter = require('./../routes/reviewRoutes');
// we can also make use of destructuring;
// const {getAllTours, createTour, getTour, updateTour, deleteTour} = require('../controllers/tourController');

const router = express.Router();

// router.param('id', tourController.checkID);
// this function is executed only in this for tour not for users because this is seperate application

// Create a checkBody middleware
// Check if body contains the name and price property
// If not, send back 400 (bad request)
// Add it to the post handler stack.


// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// GET /tour/234fad4/reviews/fsadfaf

// router
//     .route('/:tourId/reviews')
//     .post(
//         authController.protect, 
//         authController.restrictTo('user'), 
//         reviewController.createReview
//     );

router.use('/:tourId/reviews', reviewRouter);

router
    .route('/top-5-cheap')
.get(tourController.aliasTopTours, tourController.getAllTours);

router
    .route('/tour-stats')
    .get(tourController.getTourStatus);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);
// tours-distance?distance=233&center=-40,45&unit=mi
// tours-distance/233/center/-40, 45/unit/mi

router
    .route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);


router
    .route('/')
    .get(tourController.getAllTours)
//  .post(tourController.checkBody ,tourController.createTour)
    .post(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
        )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;