const router = require('express').Router()
const User = require('../Database/Models/models').user
const middleware = require('../Helpers/authMiddleware').session;
const helpers = require('../Helpers/helpers')
const Business = require('../Database/Models/models').business
const {v4: uuidv4} = require('uuid')

// Nikhil I added stuff in route for this js file, did I do it correctly?

// get all the company's info for the profile page
router.get('/profile',(request, response) => {
    const bEmail = request.decode.email

    Business.findOne({Email: bEmail}, (err, data) => {
      if(err){
          response.status(200).json({
              error: 'There was some error while searching for this user'
          })
      } else {
          const businessInfo = {
              profilePicture: data.profilePic,
              name: data.CompanyName,
              about: data.AboutMyBusiness,
              averageRating: { $avg: data.ratingsAndReviews.reviews},
              ratingsAndReviews: data.RatingsAndReviews,
              menu: data.menu
          }

          response.status(200).json({
              message: 'Success',
              businessInfo
          })

      }

    }) // find One

}) // get company's info

// update company name and return the new one
router.post('/business/changeCompanyName',(request, response) => {
    const bEmail = request.decode.email

    Business.findOneAndUpdate(
        {Email: bEmail},
        {CompanyName: request.body?.companyName},
        {new: true})
        .then(data => {
            response.status(200).json({
                message: 'Successfully updated the company name',
                data
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was an error while updating the company name'
            })
        })
})

// update company's about section  and return the new one
router.post('/business/changeAbout',(request, response) => {
    const bEmail = request.decode.email

    Business.findOneAndUpdate(
        {Email: bEmail},
        {AboutMyCompany: request.body?.aboutMyCompany},
        {new: true})
        .then(data => {
            response.status(200).json({
                message: 'Successfully updated the company about me section',
                data
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was an error while updating the about me section'
            })
        })
})

module.exports = router