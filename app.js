const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// const { get } = require('http');
const cookieParser = require('cookie-parser');
// parse the cookie coming from the server
const compression = require('compression');


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();
// const bodyParser = require('body-parser');

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))


// 1 GLOBAL MIDDLEwARES /////////////////////////////
// Implement CORS
// app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

// app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, `public`)));

// Set Security HTTP headers
// app.use(helmet().contentSecurityPolicy());
// Data Sanitization
// Clean all the data that come from malicious code

// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  // write our own middleware function
  app.use(morgan('dev'));
}

// Limit requests from same API
// it sets the no. of request to the server
// if our app crashes then it will setted to the original value that is defined
const limiter= rateLimit({
  max: 100, // 100 request
  windowMs: 60 * 60 * 1000, // From same IP in 1hrs
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api',limiter); // apply to all api routes

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
// app.post(
//   '/webhook-checkout',
//   bodyParser.raw({ type: 'application/json' }),
//   bookingController.webhookCheckout
// );

// express.json() is middle ware because it will stay b/w the req and res

// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: true }))

// Body parser, reading data from the body into req.body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// parses the data form the cookie

// Data Sanitization against NoSQL query injection
// It looks up the header and remove the $ and . sign so that any malicios code wouldn't would not work as mongodb uses this to access data
// without it the below code will give the result
//{
//   "email": { "$gt": ""},
//   "password": "test1234"
// }
app.use(mongoSanitize());

// Data Sanititzation against XSS
// It will remove malicious code html code with some javascript code in it
// It converts html code into html entity
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 
    'ratingsAverage', 
    'ratingsQuantity', 
    'maxGroupSize', 
    'difficulty', 
    'price'
  ]
}));



// if we don't define route to a link it then checks to the public folder and set it to the route
// http://127.0.0.1:3000/overview.html
// here we don't define route for this link then http://127.0.0.1:3000 is set to route and then followed by the link is searched

// middleware function process request and then send req, res to the next middleware function
// because of middleware function the order where the function is written matters and everything implements the middleware

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   console.log(req.body)
//   next();
//   // if we will not call the next then our request must not propagate further
// });

// app.use(compression());

// Sets "Content-Security-Policy: default-src 'self';script-src 'self' example.com;object-src 'none';upgrade-insecure-requests"
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      frameSrc: ["'self'", 'https://js.stripe.com/v3/'],
      imgSrc: ["'self'", 'https://*', 'http://*'],
      styleSrc: ["'self'", 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://*', 'unsafe-inline'],
      scriptSrc: ["'self'", 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'https://js.stripe.com/v3/', 'unsafe-inline','unsafe-hashes'],
      objectSrc: ["'self'"],
      connectSrc: ["'self'", 'ws://*', 'https://*', 'ws://127.0.0.1:*'],
      upgradeInsecureRequests: [],
    },
  })
);

// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );

app.use(compression());

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  // we will not be able detect the error we will be able to detect it once we get a request
  next();
});

// app.get('/', (req, res) => {
//     // res.status(200).send('Hello from the server side!');
//     res.status(404).json({message:'Hello from the server side!',
// app: 'Natours'}
// );

// in node farm project we will have to set the content type manually to json but here the express will take care of that
// });

// app.post('/', (req, res) => {
//     res.send('You can post to this endpoint...');
// })

//////////////////////////////////////////////////////////////////////////////////////////////////
// 2) ROUTE HANDLERS ////////////////////////////

//  we define a variable using colon
// app.get('/api/v1/tours/:id/:x/:y?', (req, res) => {
//     console.log(req.params);
// in request parameter the all variables are stored
// it returns the object of all the variables
// if we specify less no. of variables while searching tours then it will not route =this section
// we can set a variable optional by placing a question mark at the last of variable
// });

// 3) ROUTES //////////////////////

// getting all tour
// app.get('/api/v1/tours', getAllTours);

//posting a data
// app.post('/api/v1/tours', createTour);

// getting a single tour
// app.get('/api/v1/tours/:id', getTour);

// updating a Tour
// app.patch('/api/v1/tours/:id', updateTour);

// deleting a tour
// app.delete('/api/v1/tours/:id', deleteTour);

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// for all http methods
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`
  // });

  ///////////////////////////////////
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));

  //////////////////////////////////
  // whatever we pass to next as an argument express treat it as an error
  // when we define like this then it automatically skip all the middleware and go to error middleware
});

// console.log(x);
// error ocurred

app.use(globalErrorHandler);

// 4) SERVERS ///////////////////

module.exports = app;