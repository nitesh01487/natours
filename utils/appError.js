class AppError extends Error {
    #isOperational;
    constructor(message, statusCode) {
        super(message);
        // console.log(message, statusCode);
        this.isOperational = true;
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail': 'error';

        Error.captureStackTrace(this, this.constructor);
    } 
}

module.exports = AppError;