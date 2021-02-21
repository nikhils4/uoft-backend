const mongoose = require('mongoose');

const user = new mongoose.Schema({
    Name: {
        type: String,
        required: [true, 'Name is required'],
    },
    Email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    ProfilePic:{
        type: String
    },
    FlaggedStatus: {
        type: Boolean
    },
    FlaggedDescription: {
	    type: String
    },
	ProfilePicId: {
        type: String
    },
    Password: {
        type: String,
        required: [true, 'Password is required'],
    },
    PhoneNumber: {
        type: Number
    },
    Street: {
        type: String
    },
    City: {
        type: String
    },
    State: {
        type: String
    },
    ZipCode: {
        type: String
    },
    Country: {
	    type: String
    },
    CardNumber: {
        type: Number
    },
    CVV: {
        type: Number
    },
    CardExpiration: {
        type: String
    },
    InterestInCuisines: {
        type: [{
            Name: String,
            Country: String
        }]
    },
    Following: {
        type: [{
            RestaurantName: String,
            RestaurantId: String
        }]
    },
    ShowedInterest: {
        type: [{
            RestaurantId: String,
            RestaurantName: String,
            RequestDescription: String,
            SpecialInterest: String,
            Accepted: Boolean,
            CommentsFromRestaurant: String,
            PickUpTime: String,
            PostId: String,
            Resolved: Boolean
        }]
    },
    RatingsAndReviews: {
        type: [{
            Rating: Number,
            Review: String
        }]
    },
    UserAgent: {
        type: String
    },
    LatitudeAtReg: {
        type: String
    },
    LongitudeAtReg: {
        type: String
    },
    IsPremiumUser: {
        type: Boolean
    },
    LastLogin: {
        type: String
    },
    LastActivity: {
        type: String
    },
    IsEmailVerified: {
        type: Boolean
    },
    EmailVerificationToken: {
        type: String
    },
    Following: {
        type: Array,
        default: []
    },

})

const business = new mongoose.Schema({
    CompanyName: {
        type: String,
        required: [true, 'Company name is required']
    },
    Name: {
        type: String,
        required: [true, 'Name is required']
    },
    Email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    AboutMyBusiness: {
        type: String,
        required: [true, 'A short description is required'],
    },
    ProfilePic:{
        type: String
    },
    FlaggedStatus: {
        type: Boolean
    },
    FlaggedDescription: {
	    type: String
    },
	ProfilePicId: {
        type: String
    },
    Password: {
        type: String,
        required: [true, 'Password is required'],
    },
    PhoneNumber: {
        type: Number
    },
    Street: {
        type: String
    },
    City: {
        type: String
    },
    State: {
        type: String
    },
    ZipCode: {
        type: String
    },
    Country: {
	    type: String
    },
    CardNumber: {
        type: Number
    },
    CVV: {
        type: Number
    },
    CardExpiration: {
        type: String
    },
    Speciality: {
        type: String
    },
    RatingsAndReviews: {
        type: [{
            Rating: Number,
            Review: String
        }]
    },
    LatitudeAtReg: {
        type: String
    },
    LongitudeAtReg: {
        type: String
    },
    IsPremiumBusiness: {
        type: Boolean
    },
    LastLogin: {
        type: String
    },
    LastActivity: {
        type: String
    },
    IsEmailVerified: {
        type: Boolean
    },
    EmailVerificationToken: {
        type: String
    },
    Followers: {
        type: Array,
        default: []
    },
    Posts: {
        type: [{
            PostId: String,
            PostedAt: Date,
            PostTitle: String,
            Description: String,
            // insert complete user details in InterestShownBy
            // add something like special comments (comments from user)
            // status of request (accepted or rejected)
            // comments from business
            InterestShownBy: [],
            Resolved: Boolean
        }]
    }
})

const email = new mongoose.Schema({
    Id: {
        type: String
    },
    To: {
        type: String
    },
    Status: {
        type: Boolean
    },
    Restaurant: {
        type: String
    }
})

module.exports.business = mongoose.model('business', business)
module.exports.user = mongoose.model('user', user)
module.exports.email  = mongoose.model('email', email)