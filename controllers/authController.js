const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //     HTTP cookies are essential to the modern Internet but a vulnerability to your privacy. As a necessary part of web browsing, HTTP cookies help web developers give you more personal, convenient website visits. Cookies let websites remember you, your website logins, shopping carts and more. But they can also be a treasure trove of private info for criminals to spy on.

  // Guarding your privacy online can be overwhelming. Fortunately, even a basic understanding of cookies can help you keep unwanted eyes off your internet activity.
  res.cookie('jwt', token, cookieOptions);

  // remove the password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  // we can send the data in the form of text or in form of json (so always check postman while sending data from the postman)

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // we will have to explicitly describe the field selected if the field is selected to false in schema
  // console.log(user);
  // ('pass1234') === '$2a$12$auhwS/So89DBTH4DI/K7UuzDiluHHEDgal80SJY2GoruddFwjwA42'; // how to compare (bcrypt)

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// we need to create a jwt token with the exact same name but different string
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success'});
}

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in ! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  // The util. promisify() method basically takes a function as an input that follows the common Node. js callback style, i.e., with a (err, value) and returns a version of the same that returns a promise instead of a callback.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded)
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NTNmMjc4MTk2NjJkNTYzNGFmMTUyNyIsImlhdCI6MTY4MzI4NjU1NSwiZXhwIjoxNjkxMDYyNTU1fQ.PLIxRmdJuI8sk0VTeKuYWy0OkImc61SW8f22NusBBgQ

  // 3) Check if user still exists
  const currentUser = await User.findOne({ _id: decoded.id });
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this user does no longer exist.', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
      try {
        // 1) Verify the token
        const decoded = await promisify(jwt.verify)(
            req.cookies.jwt,
            process.env.JWT_SECRET
        );

        // 2) Check if user still exists
        const currentUser = await User.findOne({ _id: decoded.id });
        if (!currentUser) {
            return next();
        }

        // 3) Check if user changed password after the token was issued
        if (currentUser.changesPasswordAfter(decoded.iat)) {
            return next();
        }

        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      } catch(err) {
        return next();
      }
    }
    next();
};

exports.restrictTo = (...roles) => {
  // we can't pass arguments in the middleware function so we called a function and the middleware access this variables with the help of closures
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      ); // 403 means foribidden
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address. ', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // deactivate all the validators in the schema

  // 3) Send it to user's email

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'You password reset token (valid for 10 min)',
    //   message,
    // });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
  
    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordRestToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordRestToken = undefined;
  user.passwordResetExpires = undefined;
  // we have reset the token and expires time to undefined that's why it will not work for the same token and expires and will set the password only time after it's generation
  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // If we not use protect route in our routes
  // let token;
  // if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
  //     token = req.headers.authorization.split(' ')[1];
  // }
  // if(!token) {
  //     return next(new AppError('You are not logged in, Please login to get access!', 401));
  // }

  // const decoded = await promisify( jwt.verify)(token, process.env.JWT_SECRET);
  // const currentUser = await User.findOne({_id: decoded.id}).select('+password');
  // if(!currentUser) {
  //     return next(new AppError('The user belonging to this user does no longer exist.', 401));
  // }
  const currentUser = await User.findById(req.user.id).select('+password');
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this user does no longer exist.', 401)
    );
  }

  // 2) Check if POSTed current password is correct
  if (
    !(await currentUser.correctPassword(
      req.body.password,
      currentUser.password
    ))
  ) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) Check if new password is same as the previous one or not
  if (req.body.chpswd === req.body.password) {
    return next(
      new AppError(
        'Your new password must be different than previous own.!',
        500
      )
    );
  }

  // 3) If so, update password
  currentUser.password = req.body.chpswd;
  currentUser.passwordConfirm = req.body.chpswdConfirm;
  await currentUser.save();
  // User.findByIdAndUpdate will NOT work as intended because mongoose will not remember the current object behind the secenes

  // 5) Log user in, send JWT
  createSendToken(currentUser, 200, res);
});
