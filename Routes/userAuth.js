const router = require('express').Router()
const User = require('../Database/Models/models').user
const upload = require('./multer')
const cloudinary = require('./cloudinary')
const middleware = require('../Helpers/authMiddleware').session;
const fs = require('fs')
const helpers = require('../Helpers/helpers')
const parser = require('ua-parser-js');
const triggerEmail = require('../Helpers/mailer').triggerEmail
const jwt = require('jsonwebtoken')
const {v4: uuidv4} = require('uuid')

// signup for user
router.post('/user/signup', (request, response) => {
    const userData = {}     // user data object

    // all the names need to be EXACTLY the same as the model
    const name = request.body?.name

    userData.Name = request.body?.name
    userData.Email = request.body?.email
    console.log('password in the endpoint ', request.body)
    userData.Password = helpers.hashAndReturn(request.body?.password) // hash helper function is in helper.js
    userData.FlaggedStatus = false // by default
    userData.FlaggedDescription = '' // default
    userData.ProfilePic = `https://ui-avatars.com/api/?name=${name.split(' ')[0]}`
    userData.ProfilePicId = 'Default image'
    userData.PhoneNumber = request.body?.phoneNumber
    userData.Street = request.body?.street
    userData.City = request.body?.city
    userData.State = request.body?.state
    userData.ZipCode = request.body?.zipCode
    userData.Country = "Canada" // by default (at least for now)
    userData.CardNumber = request.body?.cardNumber
    userData.CVV = request.body?.cvv
    userData.CardExpiration = request.body?.cardExpiration
    userData.InterestInCuisines = []
    userData.Following = []
    userData.ShowedInterest = []
    userData.RatingsAndReviews = []
    userData.UserAgent = JSON.stringify(parser(request.headers['user-agent']))
    userData.LatitudeAtReg = request.body?.latitudeAtReg
    userData.LongitudeAtReg = request.body?.longitudeAtReg
    userData.IsPremiumUser = false
    userData.LastLogin = ''
    userData.LastActivity = new Date()
    userData.IsEmailVerified = false
    userData.EmailVerificationToken = uuidv4()

    // Send verification email


    const verificationUrl = `https://avenoir.netlify.app/user/verify?token=${userData.EmailVerificationToken}`

    const text =  `Hey ${userData.Name}, \n\nPlease click on the following link to verify your email - ${verificationUrl} . \n\nTeam Avenoir`


    // check for duplicates before triggering a email
    User.findOne({Email: request.body?.email}, (err, res)  => {
        if(err){
            // say there is an error
            response.status(200).json({
                message: 'An error occured while checking for duplicate email'
            })
        }
        else if(res){ // kajal change this from if -> else if. is this correct?
            // this is a duplicate email
            response.status(200).json({
                message: 'Trying to sign up with a duplicate email'
            })
        } else {
            // put all the logic here
            triggerEmail('Avenoir avenoir@gmail.com', userData.Email, "Verify your Avenoir account", text)
            .then(res => {
                    // created a profile is a User object
                    // User is a mongoose object
                    const profile = new User(userData)

                    // adds user to the database
                    profile.save((err) => {
                        if (err) {
                            if (err.code === 11000) {
                                response.status(200).json({
                                    error: 'The email is already registered, use another email!',
                                })
                            } else {
                                response.status(200).json({
                                    error: 'There was some error, while saving the data in the db',
                                    err
                                })
                            }
                        } 
                        else {
                            response.status(200).json({
                                message: 'The user signed up successfully'
                            })
                        }
                    })

                })
                .catch(err => {
                    response.status(200).json({
                        message: 'An error occured while sending email'
                    })
                })
            
        }

    }) // find one

}) // signup for user




    // How to send email verification 
    // 1. take the email and create a hash using the helper function
    // 2. create a link that and append the created hash to the url
    // 3. trigger a verification email with the following link:
    //  https://avenoir.netlify.app/verify.html?token=kuasGFKUYVdsvsuvdvcsvdvchjsvdjkvjsvdyvwkluva
    // 4. email this link to the verification email
    // 5. when the link is clicked then we un-hash the email
    // 6. compare to the stored emailVerificationToken if it matches then change the isEmailVerified to true.
    // Done!



// login for user
router.post('/user/login', (request, response) => {
    // first check that the email is verified 
    // check passwords
    // get id and pw from the frontend
    // const email = request.decode.Email

    User.findOne({
        Email: request.body.email
    }, (err, data) => {
        if(err) {
            response.status(200).json({
                error: 'There was some error while fetching the data'
            })
        } else if (!data){
            response.status(200).json({
                error: 'No such user found'
            })
        } else {
            User.findOneAndUpdate({
                Email: request.body.email
            },{
                UserAgent: JSON.stringify(parser(request.headers['user-agent'])),
                LastLogin: new Date().toLocaleString()
            },{
                new: true,
                runValidators: true
            })
                .then(doc => {
                    if(doc.IsEmailVerified){
                        if(helpers.passwordAuth(data.Password, request.body.password)){
                            const payload = {
                                email: data.Email
                            }
                            const token = jwt.sign(payload, process.env.PW_SECRET)
                            response.status(200).json({
                                message: 'Successfully logged in',
                                token
                            })
                        } else {
                            response.status(200).json({
                                error: 'The credentials did not match'
                            })
                        }
                    }
	                 else {
                        response.status(200).json({
                            error: 'Verify your email first and then login'
                        })
                    }
                })
                .catch(err => {
                    response.status(200).json({
                        error: err
                    })
                })
        }
    })
})

// verifying email for user
router.post('/user/verifyemail', (request, response) => {
    const id = request.query.id
    User.findOneAndUpdate({
        EmailVerificationToken: id
    }, {
        IsEmailVerified: true
    },{
        new: true,
        runValidators: true
    })
        .then(doc => {
            if(doc){
                // send email for welcoming the user
                const text = `Hey ${doc.Name}, \nYou have successfully verified your account. \n\nTeam Avenoir`
                triggerEmail('Avenoir avenoir@gmail.com', doc.Email , "Welcome to Avenoir", text)
                    .then(res => {
                        response.status(200).json({
                            message: 'The email verified successfully',
                            mailSent: true
                        })
                    })
                    .catch(err => {
                        response.status(200).json({
                            message: 'The email verified successfully',
                            mailSent: false
                        })
                    })
            } else {
                response.status(200).json({
                    error: 'Invalid request'
                })
            }
        })
        .catch(err => {
            response.status(200).json({
                error: 'Error while verifying your email'
            })
        })
})

router.post('/user/forgotpassword', (request, response) => {
    const password = helpers.createPassword(8)
    const text = `Hey, \nYour new password is ${password} \n\nTeam Avenoir`
    triggerEmail('Avenoir avenoir@gmail.com', request.body.email , "Reset password", text)
        .then(res => {
            User.findOneAndUpdate({
                Email: request.body.email
            }, {
                Password: helpers.hashAndReturn(password)
            }, {
                new: true,
                runValidators: true
            })
                .then(doc => {
                    response.status(200).json({
                        message: 'Password reset successful'
                    })
                })
                .catch(err => {
                    response.status(200).json({
                        error: 'There was some error while resetting the password'
                    })
                })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was some error while resetting the password, email error'
            })
        })
})


router.post('/user/setProfilePic', middleware, upload.any('image'), async (request, response) => {
    // take this path and put it in the folder 'Avenoir profile Pics'
    const uploader = async (path) => await cloudinary.uploads(path, 'Avenoir Profile Pics');
    const urls = []
    const files = request.files;

    // iterate through files from req body file by file
    for (const file of files) {
        const { path } = file;
        const newPath = await uploader(path) // newPath is an object with url + id
        urls.push(newPath) // push into url array
        fs.unlinkSync(path) // necessary for nodejs file system to work
    }

    User.findOneAndUpdate({
        Email: request.decode.email
    }, {
        ProfilePic: urls[0].url,
        ProfilePicId: urls[0].id
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => { // why is our .then thing colored differently??
            if(doc){
                response.status(200).json({
                    message: 'Updated the profile pic successfully',
                    doc
                })
            } else {
                response.status(200).json({
                    error: 'There was some error while uploading the profile pic'
                })
            }
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was some error while setting the profile pic'
            })
        })

})

router.post('/user/setpassword', middleware, (request, response) => {
    const password = request.body.password
    User.findOneAndUpdate({
        Email: request.decode.email
    }, {
        Password: helpers.hashAndReturn(password)
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => {
            response.status(200).json({
                message: 'Password set successful'
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was some error while setting the password'
            })
        })
})

router.get('/profile/get', middleware, (request, response) => {
    User.findOne({
        Email: request.deocode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error'
            })
        } else {
            response.status(200).json({
                message: data
            })
        }
    })

})

module.exports = router