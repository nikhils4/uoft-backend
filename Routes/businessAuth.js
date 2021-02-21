const router = require('express').Router()
const Business = require('../Database/Models/models').business
const upload = require('./multer')
const cloudinary = require('./cloudinary')
const middleware = require('../Helpers/authMiddleware').session;
const fs = require('fs')
const helpers = require('../Helpers/helpers')
const parser = require('ua-parser-js');
const triggerEmail = require('../Helpers/mailer').triggerEmail
const jwt = require('jsonwebtoken')
const {v4: uuidv4} = require('uuid')


// -------------------------------------------------------------------------------------------
// business sign up
//  
//  1. make a post request to get information that the schema needs
//  2. upload the photo information to cloudinary 
//  3. set the model fields to the corresponding body values (or to the default values)
//  4. generate a verification email for the email the user entered
//  5. send verification email (using mailgun) 
//      -- If email is sent sucessfully
//          a) if the email is verified 
//              - create a business document object in the database!
//          b) the email isn't verified
//              - send message saying the email was not verified
//      -- If the email is NOT sent sucessfully 
//          send message that details this
// -------------------------------------------------------------------------------------------
router.post('/business/signup',(request, response) => {
    // take this path and put it in the folder 'avenoir profile Pics'
    const businessData = {} // forward declaring data object for when we create a business object
    const name = request.body?.name
    console.log(request.body)
    // initializing each field in the businessData object
    // all the names need to be EXACTLY the same as the model
    businessData.Name = request.body?.name   // the ? checks that we actually recieved something like this in the body before adding it
    businessData.CompanyName = request.body?.CompanyName
    businessData.Email = request.body?.email
    businessData.AboutMyBusiness = request.body?.AboutMyBusiness
    businessData.Password = helpers.hashAndReturn(request.body?.password) // hash helper function is in helper.js
    businessData.ProfilePic = `https://ui-avatars.com/api/?name=${name.split(' ')[0]}`
    businessData.ProfilePicId = 'Default image'
    businessData.FlaggedStatus = false // by default
    businessData.FlaggedDescription = '' // default
    businessData.PhoneNumber = request.body?.phoneNumber
    businessData.Street = request.body?.street
    businessData.City = request.body?.city
    businessData.State = request.body?.state
    businessData.ZipCode = request.body?.zipCode
    businessData.Country = "Canada" // by deafult (at least for now)
    businessData.CardNumber = request.body?.cardNumber
    businessData.CVV = request.body?.cvv
    businessData.CardExpiration = request.body?.cardExpiration
    businessData.Speciality = request.body?.expertise
    businessData.RatingsAndReviews = []
    businessData.userAgent = parser(request.headers['user-agent'])
    businessData.LatitudeAtReg = request.body?.latitudeAtReg
    businessData.LongitudeAtReg = request.body?.longitudeAtReg
    businessData.IsPremiumbusiness = false
    businessData.LastLogin = ''
    businessData.LastActivity = new Date()
    businessData.IsEmailVerified = false
    businessData.MenuItem = []
    businessData.EmailVerificationToken = uuidv4()

    // combine the url with the token we created for a unique verfication url
    const verificationUrl = `https://avenoir.netlify.app/verifyBusiness?token=${businessData.EmailVerificationToken}`

    const sender = 'Kajal, kajalt@live.com'
    const sendTo = businessData.Email
    const subject = 'Confirm your Avenoir account'
    const text = `Hello, ${businessData.CompanyName}, \n\nPlease click on the following link to verify your email: \n${verificationUrl}\n\n Note: If you did not sign up for this account, you can ignore this email.\n\n— Avenoir`

    Business.findOne({Email : request.body?.email}, (err, data) => {

        // if an error occurs while searching the db
        if(err) {
            response.status(200).json({
                error: 'There was some error, while confirming that the email is not a duplicate',
                err
            })
        }
        else if(data){
          // findOne returned something
            response.status(200).json({
                error: 'this email already exists in our database',
                err
            })
        } else {

            // send the email
            triggerEmail(sender, sendTo, subject, text)
                .then(res => {
                    // we sent the email sucessfully!

                    // create an instance of business object (look at models.js)
                    const profile = new Business(businessData)

                    // tries to add the business object to the database
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
                        } else {
                            response.status(200).json({
                                message: 'The business signed up successfully' // we added the business object to the database
                            })
                        }
                    })
                })
                .catch(err =>
                    // we weren't able to send the email sucessfully so the account will not be created :(
                    response.status(200).json({
                        error: 'Error sending email. User was not added to the database',
                        err
                    })
                ) // trigger email' catch
        }

    }) // findOne

}) // signup

// ----------------------------------------------------------------------
//  business log in
//
//  1. post request to get the email and password 
//  2. check the db for the email 
//      a) if we find the email
//          is the email is verified?
//          // make sure passwords match
//              i) if the password match
//                      // success! update local storage so the user doesn't have to keep signing in 
//              ii) the password doesn't match
//                      // send a message that the password doesn't match
//      b) we can't find the email in the db
//          // send a message that no such user exists, they need to create an
//          // account first
//  
// ----------------------------------------------------------------------
router.post('/business/login', (request, response) => {
    
    Business.findOne({
        Email: request.body.email
    }, (err, data) =>  {
        if (err) {
            // some error occured
            response.status(400).json({
                error: 'There was some error, while saving the data in the db'
            })
        } else if (!data){
            // we don't find any business with the same email
            response.status(400).json({
                message: 'No such business found' // we added the business object to the database
            })
        }
        else {
            // we found the user! store info in local storage (this means we are loggin in) 
            // update the last login and userAgent info

            Business.findOneAndUpdate({
                // filter to find 
                Email: request.body.email  
            },{
                // what to change for the given email
                UserAgent: JSON.stringify(parser(request.headers['user-agent'])),
                LastLogin: new Date().toLocaleString()
            },{
                // options 
                new: true, // always return the new updated version
                runValidators: true // revalidate this object since we changed it
            })
                .then(doc => {
                    // doc is the object that findOneAndUpdate returned 

                    if(doc.IsEmailVerified){
                        // they have a verfied email!

                        // passwordAuth compares the password they entered 
                        // to the has we have stored for this user
                        if(helpers.passwordAuth(doc.Password, request.body.password)){
                            // they entered the correct password!!
                            const payload = {
                                email: doc.Email
                            }

                            // jwt is a library that creates a unique token (like hash) using 
                            // the user's email and SECRET
                            // we return this token to the front end and they store it in their local storage
                            const token = jwt.sign(payload, process.env.PW_SECRET)
                            response.status(200).json({
                                message: 'Sucessfully logged in',
                                token
                            })        
                        } 
                        else {
                            // they entered the wrong password
                            response.status(200).json({
                                error: 'The password is incorrect'
                            })
                        }
                    } 
                    else {
                        // they have an account but they didn't verfiy their email
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
      });

}) // log in


// ----------------------------------------------------------------------
//  verify business
//
//  1. get the token from url
//  2. search for a business with this token in our database
//      a) if it exists!
//          update that the user has been verified
//          send message
//      b) no such business exists
//          send error message
// ----------------------------------------------------------------------
router.post('/business/verifyemail', (request, response) => {
    const id = request.query.id // save the url they clicked to verify their account

    // if the id matches and EmailVerificationTone in your db
    Business.findOneAndUpdate({
        EmailVerificationToken: id // search for
    }, {
        IsEmailVerified: true // if found update that the email has been verified for this user
    }, {
        new: true, // return the updated object
        runValidators: true // revalidate the new updated object
    })
        .then(doc => {
            // confirm that the object is not null
            if(doc){
                // the email ver token exists in our db

                const sender = 'Avenoir avenoir@gmail.com'
                const sendTo = doc.Email
                const subject = 'Welcome to Avenoir!'
                const text = `Hello, ${doc.CompanyName}, \n\nYou have successfully verified your account.\n\n— Team Avenoir`
                
                triggerEmail(sender, sendTo , subject, text)
                .then(res => {
                    response.status(200).json({
                        message: 'The email verified successfully',
                        mailSent: true // and the customer was emailed
                    })
                })
                .catch(err => {
                    response.status(200).json({
                        message: 'The email verified successfully',
                        mailSent: false // but the customer was not emailed
                    })
                })
            } else {
                // that email ver token doesn't exist in our db
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
}) // verify business

// ----------------------------------------------------------------------
//  forgot my password
//
//  1. generate a temp new password
//  2. try to send the email this new password
//      a) we were able to find a business with this email!
//              i) they were emailed successfully!
//                  Change  the password
//              ii) we weren't able to send them an email :(
//                  Do NOT change the password
//      b) no such bussiness exists in the database
//          send error message
// ----------------------------------------------------------------------
router.post('/business/forgotPassword', (request, response) => {
    const password = helpers.createPassword(8)

    // email info
    const email = request.body.email;
    const sender = 'Avenoir avenoir@gmail.com'
    const subject = 'Email reset request'
    const text = `Hello,\n\nYour new password is ${password}. You can go to your account settings to set a new password.\n\n— Team Avenoir`

    // try to send the email
    triggerEmail(sender, email, subject, text)
        .then(res => {
            Business.findOneAndUpdate(
                {Email: email},
                {Password: helpers.hashAndReturn(password)},
                {new: true, runValidators: true}
            )
                .then(doc => {
                    response.status(200).json({
                        message: 'Password reset successful'
                    })
                })
                .catch(err => {
                    response.status(200).json({
                        error: 'An error occured white resetting the password'
                    })
                })
        })
        .catch(err => {
            response.status(200).json({
                error: 'An error occurred while we were trying to reset your email, email error'
            })
        })

}) // forgot my password

// ----------------------------------------------------------------------
//  set Password
//
//  1. get the email and the new password from the body
//  2. check if the email exists in the db and grab it
//  3. update the password
// ----------------------------------------------------------------------
router.post('/business/setPassword', middleware, (request, response) => {
    const email = request.body.email;
    const newPassword = request.body.password;

    Business.findOneAndUpdate(
        {Email: email},
        {Password: helpers.hashAndReturn(newPassword)},
        {new:true, runValidators: true}
        )
        .then (data => {
            response.status(200).json({
                message: 'Password set successful'
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'An error occurred while trying to set new password.'
            })
        })
})


// ----------------------------------------------------------------------
//  set Profile Picture
//
//  1. get the email and the new picture from the body
//  2. check if the email exists in the db and grab it
//  3. update the profile picture
// ----------------------------------------------------------------------
router.post('/business/setProfilePic', middleware, upload.any('image'), (request, response) => {
    const email = request.decode.email;
    const newUrls = []
    const uploader = async (path) => await cloudinary.uploads(path, 'Avenoir Profile Pics');
    const files = request.files;

    // iterate through files from req body file by file
    for (const file of files) {
        const { path } = file;
        const newPath = uploader(path) // newPath is an object with url + id
        newUrls.push(newPath) // push into url array
        fs.unlinkSync(path) // necessary for nodejs file system to work
    }


    // update and fields for this object
    Business.findOneAndUpdate(
        {Email: email}),
        {ProfilePic: newUrls[0].url, ProfilePicId: newUrls[0].id},
        {new: true, runValidators: true}
        .then(data => {
            if(data) {
                response.status(200).json({
                    message: 'Profile picture set was successful',
                    data
                })
            } else {
                response.status(200).json({
                    error: 'There was some error while uploading the profile pic'
                })
            }
        })
        .catch(err => {
            response.status(200).json({
                error: 'An error occurred while trying to delete the photo.'
            })
        })

}) // set profile pic

router.post('/business/setpassword', middleware, (request, response) => {
    const password = request.body.password
    Business.findOneAndUpdate({
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

}) // set Password

module.exports = router
