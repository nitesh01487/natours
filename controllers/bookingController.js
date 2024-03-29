const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, 
        mode: "payment",
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'inr',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary, //description here
                        // images: [
                        //     `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
                        // ],
                    },
                },
            }
        ]
    })
    // console.log(`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`)

    // const session = await stripe.checkout.sessions.create({
    //         payment_method_types: ['card'],
    //         success_url: `${req.protocol}://${req.get('host')}/`,
    //         cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    //         customer_email: req.user.email,
    //         client_reference_id: req.params.tourId, 
    //         mode: "payment",
    //         currency: 'inr',
    //         customer_details: {
    //             name: `${tour.name} Tour`
    //         },
    //         line_items: [
    //             {
    //                 description: tour.summary,
    //                 images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    //                 amount: tour.price,
    //                 quantity: 1
    //             }
    //         ]
    //     })
    



    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    })
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // This only temporary, because it is UNSECURE: because everyone can make bookings without paying
    const {tour, user, price} = req.query;

    if(!tour && !user && !price) return next();
    await Booking.create({tour, user, price});

    res.redirect(req.originalUrl.split('?')[0])
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
