const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');
// const Review = require('./reviewModel');

// we will see data validation and sanitization
// validator and sanititzation library

// mongoose uses native javascript datatype
// set schema and validation of database
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'], // validator (any)
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'], // for string
        minlength: [10, 'A tour name must have more or equal then 10 characters'] // for string
        // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        } // only for string
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'], // for dates also
        max: [5, 'Rating must be below 5.0'], // for num and dates
        set: val => (Math.round(val * 10) / 10) // 4.6666, 46.666, 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON (Embeded)
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
            // Geospatial data will contain lat, lng or line or even polygon
        },
        coordinates: [Number], //Coordinates of number first lng and then lat
        address: String,
        description: String
    },
    locations: [
        // inorder to create a new document which is embeded inside another documet we need to specify the array of objects
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    // guides: Array  // embedding
    guides: [  // referencing
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
    // reviews: [
    //     {
    //         type: mongoose.Schema.ObjectId,
    //         ref: 'Review'
    //     }
    // ]
}, {
    toJSON: { virtuals: true}, // virtuals are true if we get data in the form of JSON
    toObject: { virtuals: true} // virtuals are true if we get data in the form of Object
});
// In it the first argument is object with data definition
// In it the second argument is object with data options

// tourSchema.index({price: 1}) // means in ascending and -1 means desc
// we suppose want to search for a query for e.g, price then the mongodb will have to search for the entire document in mongodb documents
// the best thing to do it is to create a index of that field
// we need to delete the index from the mongodb

tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
tourSchema.index({ startLocation: '2dsphere' });

// Virtual Properties are the property that are not persisted
// for e.g; converting a mile into km 
tourSchema.virtual('durationWeeks').get(function() {
    // here the regular function is used as the arrow function is not have its this keyword
    return this.duration / 7;
});
// we are implementing the mvc architecture and in it 
// we belive fat model and thin controller 
// this is business logic. So, we will try to put this logic into model and not in the controller

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review', // The model to use
    foreignField: 'tour', // that name of that field
    localField: '_id' //
})

///////////////////////////////////////////////////////////
// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true});
    next();
});

// Responsible for embedding the data
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('Will save documet...');
//     next();
// });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// tourSchema.post('save', function(doc, next) {
//     // we no longer have this keyword but we have the finsh keyword doc
//     console.log(doc);
//     next();
// })

///////////////////////////////////////////////////////////
// QUERY MIDDLEWARE
// for single tour or for findOne it will not work
tourSchema.pre(/^find/, function(next) {
// tourSchema.pre('find', function(next) {
    this.find({ secretTour: {$ne: true}});
    // we will hide the tour
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    
    next();
})

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    // console.log(docs);
    next();
});


///////////////////////////////////////////////////////////
// AGGREGATION MIDDLEWARE
// for single tour or for findOne it will not work
// tourSchema.pre('aggregate', function(next) {
//     this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
//     // we will still use the hided tour in it
//     console.log(this.pipeline());
//     next();
// });



// set them to database
const Tour = mongoose.model('Tour', tourSchema);

// create the collections
// const testTour = new Tour({
//     name: 'The Park Camper',
//     price: 49
// });

//save them
// testTour.save().then(doc => {
//     console.log(doc)
// }).catch(err => {
//     console.log('ERROR :', err);
// })

module.exports = Tour;

// mongoose also has middleware just like express
// with the help of this we will be able to make a function call between when a save command issue and issuing of the document.  whenever the document is saved.
// 4 types of middleware :-
// 1. document (runs before and after saving of a document)
// 2. query (allow to run function before and after the query is executed)
// 3. aggregate
// 4. model

// debugging tool ndb
