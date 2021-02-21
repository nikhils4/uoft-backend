const router = require('express').Router()
const User = require('../Database/Models/models').user
const middleware = require('../Helpers/authMiddleware').session;
const helpers = require('../Helpers/helpers')
const Business = require('../Database/Models/models').business

// get followers
router.post('/business/getFollowers', middleware, (request, response) => {
    const bEmail = request.decode.email
    Business.findOne({
        Email: bEmail
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error file fetching the errors'
            })
        } else {
            response.status(200).json({
                message: data.Followers
            })
        }
    })
})

module.exports = router