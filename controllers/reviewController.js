// const AppError = require('../utils/appError');
// const catchAsync = require('./../utils/catchAsync');
// const Tour = require('./../models/tourModel');
// const User = require('./../models/userModel');

const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id;
    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

////////////////////////////////////////////////////////////////////////////
///////////          GET ALL REVIEWS                   /////////////////////
////////////////////////////////////////////////////////////////////////////

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     let filter = {};
//     if(req.params.tourId) filter = { tour: req.params.tourId};

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'sucess',
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     })

// });

////////////////////////////////////////////////////////////////////////////
///////////          CREATE NEW REVIEWS                   /////////////////////
////////////////////////////////////////////////////////////////////////////

// exports.createReview = catchAsync(async (req, res, next) => {
//     const { email, review, name } = req.body;

//     if(!review || !name) {
//         return next(new AppError(`You can't post a review without name of tour or without a review`, 401));
//     }

//     const Tour_id = await Tour.findOne({name});
//     const User_id = await User.findOne({email});

//     const newReview = await Review.create({
//         review,
//         rating: req.body.rating,
//         createdAt: req.body.createdAt,
//         tour: Tour_id.id,
//         user: User_id.id
//     })

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     })
// })


// exports.createReview = catchAsync(async (req, res, next) => {
//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     })
// });


