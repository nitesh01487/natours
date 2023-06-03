const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']  
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// child know the id parent i.e; tour and user
// parent child referencing
reviewSchema.pre(/^find/, function(next) {
    this
        // .populate({
        //     path: 'tour',
        //     select: 'name'
        // })
        .populate({
            path: 'user',
            select: 'name photo'
        })

    next();
});

reviewSchema.index({tour: 1, user: 1}, {unique: true});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour', 
                nRating: {
                    $sum: 1
                },
                avgRating: {$avg: '$rating'}
            }
        }
    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating, 
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0, 
            ratingsAverage: 4.5
        })
    }
}

// for calculating the rating and average of rating of reviews
reviewSchema.post('save', function(){
    // this points to current review
    // here we don't have the access of the variable Review so, with the help of the constructor we can access that Review
    this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
    // /^findOneAnd/ this will also work for findOne and deleteOne because they are the shorthand for findOneAndUpdate and findOneAndDelete
    this.r = await this.findOne();
    // save the variable in r and send it to post
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    // this.findOne() dose NOT work here, query has already executed
   await this.r.constructor.calcAverageRatings(this.r.tour); 
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;