const multer = require('multer');
const sharp = require('sharp');

// const fs = require('fs');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
}

// const upload = multer({ dest: 'public/img/users'});
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// when there is mix of images
exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3 }
]);

// single images
// upload.single('image') // req.file
// multiple images with same name // req.files
// uploadUserPhoto.array('images', 5)

exports.resizeTourImages =catchAsync(async (req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${req.body.imageCover}`);
    // req.body.imageCover = imageCoverFilename;

    // 2) Images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({quality: 90})
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        })
    );

    console.log(req.body)
    next();
});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    console.log('hello from middleware ha ha')
    next();
};


exports.getTourStatus = catchAsync(async (req, res, next) => {
    // aggregation pipeline is a mongodb feature and mongoose gives access to it, so that it can be used in mongodb driver
    // try{
        const stats = await Tour.aggregate([
            {
                // it filters the documents
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                // we can able to group documents with the help of accumulators 
                $group: {
                    _id: {$toUpper: '$difficulty'},
                    // _id: '$ratingsAverage',
                    numTours: {$sum: 1},
                    avgRating: { $avg: '$ratingsAverage'},
                    numRatings: {$sum: '$ratingsQuantity'},
                    avgPrice: { $avg: '$price'},
                    minPrice: { $min: '$price'},
                    maxPrice: { $max: '$price'}
                }
            },
            {
                $sort: {avgPrice: 1}
            }
            // we can repeat the aggregation
            //,
            // {
            //     $match: { _id: {$ne: 'EASY'}}
            // }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });

    // } catch(err) {
    //     res.status(404).json({
    //         status: 'fail', 
    //         message: err
    //     })
    // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    // try{
        const year = req.params.year; // 2021
        
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: {$month: '$startDates'},
                    numTourStarts: { $sum: 1},
                    tours: { $push: '$name'}
                }
            },{
                $addFields: {
                    month: '$_id'
                }
            },{
                $project: {
                    _id: 0,
                    // 0 for not including
                    // 1 for including
                }
            },
            {
                $sort: {
                    numTourStarts: -1
                    // 1 is for ascending and -1 is for descending
                }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            status: 'success',
            length: plan.length,
            data: {
                plan
            }
        });

    // } catch(err){
    //     res.status(404).json({
    //         status: 'fail', 
    //         message: err
    //     });
    // }
});


exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: 'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat, lng.', 
                400))
                
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format lat, lng.', 
                400)
        );        
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                // first pipeling and only and there must be a one goespecial index
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1,

            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})

////////////////////////////////////////////////////////////////////////////
///////////          CHECK ID, CHECK BODY                     /////////////////////
////////////////////////////////////////////////////////////////////////////
// for testing
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

// exports.checkID = (req, res, next, val) => {
//     console.log(`Tour id is: ${val}`);
//     if(req.params.id * 1 > tours.length || req.params.id < 0) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid ID'
//         })
//     }
//     next();
// }

// exports.checkBody = (req, res, next) => {
//     console.log(`Hello from the middleware ....`);
//     if(!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Missing name or price'
//         })
//     }
//     next();
// }


////////////////////////////////////////////////////////////////////////////
///////////          GET ALL TOURS                     /////////////////////
////////////////////////////////////////////////////////////////////////////
// exports.getAllTours = catchAsync(async (req, res, next) => {

//     // try{    

// ////////////////////////////////////////////////////////////////////////////////////
//         // console.log(req.query);
//         // BUILD QUERY
//         // 1A) Filtering
//         // const queryObj = {...req.query};
//         // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//         // excludedFields.forEach(el => delete queryObj[el]);

//         // // 1B) Advanced filtering
//         // let queryStr = JSON.stringify(queryObj);
//         // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//         // // console.log(JSON.parse(queryStr));
        
//         // // const tours = await Tour.find({
//         //     //     duration: 5,
//         //     //     difficulty: 'easy'
//         //     // });
            
//         //     // const tours = await Tour.find(req.query);
//         //     // it returns all tours of array
            
//         // let query = Tour.find(JSON.parse(queryStr));

//         // 2) Sorting
//         // if(req.query.sort) {
//         //     const sortBy = req.query.sort.split(',').join(' ');// http://test.com/sort
//         //     // console.log(sortBy)
//         //     query = query.sort(sortBy);
//         //     // sort('price ratingsAvaerage')
//         // } else {
//         //     query = query.sort('-createdAt');
//         // }

//         // 3) Field Limiting
//         // if(req.query.fields) {
//         //     const fields = req.query.fields.split(',').join(' ');
//         //     // here we will include the fields which is specified in the url with the help of ,
//         //     query = query.select(fields);
//         // } else {
//         //     query = query.select('-__v');
//         //     // we will exclude all of the fields with the help of -sign
//         //     // for example here we excluded the __v and whenever the user calls the api and don't specify the fields then the __v is not included
//         // }

//         // console.log(await query);

//         // 4) Pagination (not working)
// //         const page = parseInt(req.query.page )|| 1;
// //         const limit = parseInt(req.query.limit) || 100;
// //         const skip = (page -1 ) * limit ;
// //         // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
// //         // query = query.skip(20).limit(10);
// //         // skips 20 results 
// //         query = query.skip(skip).limit(limit);
// //         // console.log(await query.skip(6).limit(3));
// // console.log(skip,limit,page)
// //         if(req.query.page) {
// //             const numTours = await Tour.countDocuments();
// //             if(skip >= numTours) throw new Error('This page does not exist');
// //         }

// //////////////////////////////////////////////////////////////////

//         // EXECUTE QUERY
//         const features = new APIFeatures(Tour.find(), req.query)
//                             .filter()
//                             .sort()
//                             .limitFields()
//                             .paginate();
//         const tours = await features.query;
//         // console.log(tours);

//         // const query = await Tour.find()
//         // .where('duration')
//         // .equals(5)
//         // .where('difficulty')
//         // .equals('easy');

//         // { difficulty: 'easy', duration: { $gte: 5} }
//         // {difficulty: 'easy , duration: { gte: '5' } }

//         // SEND RESPONSE
//         res.status(200).json({
//             status: 'success',
//             results: tours.length,
//             data: {
//                 tours
//             }
//         })
//     // }catch(err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     })
//     // }
// });


//  we define a variable using colon
// app.get('/api/v1/tours/:id/:x/:y?', (req, res) => {
    //     console.log(req.params);
    // in request parameter the all variables are stored
    // it returns the object of all the variables 
    // if we specify less no. of variables while searching tours then it will not route =this section
    // we can set a variable optional by placing a question mark at the last of variable 
    // });

    
////////////////////////////////////////////////////////////////////////////
///////////          GET TOUR                          /////////////////////
////////////////////////////////////////////////////////////////////////////
// exports.getTour = catchAsync(async (req, res, next) => {

//     // try{
//         // populate methods embeds the data according referencing id
//         const tour = await Tour.findById(req.params.id).populate('reviews'); // populates effects the performance but it is managable for small project
//         // this findById do same work as that of findOne
//         // Tour.findOne({ _id: req.params.id })

//         if(tour === null) {
//             return next(new AppError('No tour found with that ID', 404));
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour
//             }
//         });
//     // } catch(err) {
//     //     res.status(404).json({
//     //         status: 'fail',
//     //         message: err
//     //     })
//     // }
//     // console.log(req.params);
//     // // js will convert it to number
//     // const id = req.params.id * 1;
//     // const tour = tours.find(el => el.id = id);
    
//     // if(id > tours.length || id < 0) {
//     //     // if(tour.length === 0) {
//     //         return res.status(404).json({
//     //             status: 'fail',
//     //     message: 'Invalid ID'
//     // });
//     // }

//     // res.status(200).json({
//     //     status: 'success',
//     //     data: {
//     //         tour
//     //     }
//     // });
// });


////////////////////////////////////////////////////////////////////////////
///////////          CREATE TOUR                       /////////////////////
////////////////////////////////////////////////////////////////////////////
// exports.createTour = catchAsync(async (req, res, next) => {

//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     })

/////////////////////////////////////////////////////
    // all the data associated with the requests will stay inside the req
    // instead the express doesn't put the data in the request instead it uses middle ware
    
    // console.log(req.body);
    // const newId = tours[tours.length - 1].id + 1;
    // const newTour = Object.assign({id: newId}, req.body);
    // tours.push(newTour);
    // we here use the async as we don't want to block the event loop
    // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`,JSON.stringify(tours), err => {
    //     // 201 is for created
    //     res.status(201).json({
    //         status: 'success',
    //         data: {
    //             tour: newTour
    //         }
    //     })
    // });

    // try {
    //     // previously
    //     // const newTours = new Tour({});
    //     // newTours.save();

    //     // Tour.create({}).then() 
    //     // instead of handling like this we will use async await

    //     const newTour = await Tour.create(req.body);

    //     res.status(201).json({
    //         status: 'success',
    //         data: {
    //             tour: newTour
    //         }
    //     })
    // } catch(err) {
    //     res.status(400).json({
    //         status: 'fail',
    //         message: err
    //     });
    // }
// });



////////////////////////////////////////////////////////////////////////////
///////////          UPDATE TOUR                       /////////////////////
////////////////////////////////////////////////////////////////////////////
// exports.updateTour = catchAsync(async (req, res, next) => {

//     // try{

//         const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//             new: true,
//             runValidators: true
//         })

//         if(tour === null) {
//             console.log('hello olleh')
//             return next(new AppError('No tour found with that ID', 404));
//         }

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 tour
//             }
//         });
//     // } catch(err) {
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: 'Invalid data sent'
//     //     });
//     // }
// });



////////////////////////////////////////////////////////////////////////////
///////////          DELETE TOUR                       /////////////////////
////////////////////////////////////////////////////////////////////////////
// exports.deleteTour = catchAsync(async (req, res, next) => {

//     // try{

//         const tour = await Tour.findByIdAndDelete(req.params.id);

//         if(tour === null) {
//             console.log('hello olleh')
//             return next(new AppError('No tour found with that ID', 404));
//         }

//         res.status(204).json({
//             status: 'success',
//             data: null
//         });

//     // } catch (err) {
//     //     res.status(400).json({
//     //         status: 'fail',
//     //         message: 'err'
//     //     });
//     // }
// });

