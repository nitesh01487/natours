const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        unique:true,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        background: true,
        unique: true,
        required: [true, 'Please provide your email'],
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'guide', 'lead-guide', 'admin']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        minLength: 8,
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function(el){
                return el === this.password; // abc === abc 
            },
            message: 'Passwords are not same'
        }
    },
    passwordChangedAt: Date,
    passwordRestToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12
    // Encrypt or hash the password
    // we use bcrypt which uses salting
    this.password = await bcrypt.hash(this.password, 12); //12 is cost of hashing

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    // this.passwordChangedAt = new Date();
    // passwordConfirm is a required field in userSchema but it is required only to take input not required to be persisted in the database
    next();
});

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    // here we subtracted the 1 sec from the passwordChangedAt as if the token created will before be the saving of passwordChangedAt
    next();
});

// Query middleware
// for all the query that starts with find
userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({active: {$ne: false}})
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    // compares the password
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changesPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000
            ,10
            );

        return JWTTimestamp < changedTimestamp; //100 < 200
    }
    // True means changed
    // False means not changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordRestToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // console.log({resetToken}, this.passwordRestToken);
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;  
}

const User = mongoose.model('User', userSchema);

module.exports = User;