const router = require('express').Router()
const User = require('../Database/Models/models').user
const middleware = require('../Helpers/authMiddleware').session;
const helpers = require('../Helpers/helpers')
const Business = require('../Database/Models/models').business
const {v4: uuidv4} = require('uuid')
const upload = require('./multer')
const cloudinary = require('./cloudinary')

// >> look over this pls Nikhil

// business post their data here to get that posted for their followers
router.post('/business/addpost', middleware, upload.any('image'), async (request, response) => {

    const postId = uuidv4()
    const postedAt = new Date()
    const postTitle = request.body.postTitle
    const description = request.body.description

    Business.findOneAndUpdate({
        Email: request.decode.email,
    }, {
        $push: {
            Posts: {
                PostId: postId,
                PostedAt: postedAt,
                PostTitle: postTitle,
                Description: description,
                InterestShownBy: [],
            }
        }
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => {
            response.status(200).json({
                message: 'Successfully posted the menu'
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was some error'
            })
        })
}) // add to menu

// to delete the post
router.post('/business/delete/post', middleware,(request, response) => {
    Business.findOneAndUpdate({
        Email: request.decode.email
    }, {
        $pull: {
            Posts: {
                PostId: request.body.id
            }
        }
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => {
            response.status(200).json({
                message: 'The post deleted successfully'
            })
        })
        .catch(err => {
            response.status(200).json({
                error: 'There was some error',
                err
            })
        })
})

// to get all the post made by that particular business -- how to get multiple post from all the restaurants to the user feed??
router.get('/business/getpost', middleware, (request, response) => {
    Business.findOne({
        Email: request.decode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error'
            })
        } else {
            response.status(200).json({
	            message: data.Posts
            })
        }
    })
})

module.exports = router
