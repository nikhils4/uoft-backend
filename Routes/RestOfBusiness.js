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

//
// router.post('/business/getAllRequests', middleware, (request, response) => {
//     Business.findOne({
//         Email: request.decode.email
//     }, (err, data) => {
//         if(err){
//             response.status(200).json({
//                 error: 'There was some error'
//             })
//         } else {
//             const posts = data.Posts
//             let responseArray = []
//             posts.forEach(post => {
//                 post.forEach(ele => {
//                     let obj = {}
//                     obj.post = post
//                     obj.interestShownBy = ele
//                     responseArray.push(obj)
//                 })
//             })
//             response.status(200).json({
//                 message: responseArray
//             })
//         }
//     })
// })

router.post('/business/acceptRequest', middleware, (request, response) => {
    const postId = request.body.postId
    const userId = request.body.userId
    Business.updateOne({
        Email: request.decode.email,
        "Posts.PostId": postId
    }, {
        $set: {
            "RequestAccepted": true,
            "CommentsForUserByBusiness": request.body.comments
        }
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => {
            User.updateOne({
                Email: userId,
                "ShowedInterest.PostId": postId
            }, {
                $set: {
                    "CommentsFromRestaurant": request.body.comments,
                    "Accepted": true
                }
            }, {
                new: true,
                runValidators: true
            })
                .then(doc => {
                    response.status(200).json({
                        message: 'Successfully accepted the request'
                    })
                })
                .catch(err => {
                    error: 'There was some error'
                })
        })
        .catch(err => {
            response.status(200).json({
                error: "There was some error"
            })
        })
})

router.post('/business/rejectRequest', middleware,(request, response) => {
    const postId = request.body.postId
    const userId = request.body.userId
    Business.updateOne({
        Email: request.decode.email,
        "Posts.PostId": postId
    }, {
        $set: {
            "RequestAccepted": false,
            "CommentsForUserByBusiness": request.body.comments
        }
    }, {
        new: true,
        runValidators: true
    })
        .then(doc => {
            User.updateOne({
                Email: userId,
                "ShowedInterest.PostId": postId
            }, {
                $set: {
                    "CommentsFromRestaurant": request.body.comments,
                    "Accepted": false
                }
            }, {
                new: true,
                runValidators: true
            })
                .then(doc => {
                    response.status(200).json({
                        message: 'Successfully accepted the request'
                    })
                })
                .catch(err => {
                    error: 'There was some error'
                })
        })
        .catch(err => {
            response.status(200).json({
                error: "There was some error"
            })
        })
})

router.get('/business/getAcceptedPosts', middleware, (request, response) => {
    Business.findOne({
        Email: request.decode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error'
            })
        } else {
            const posts = data.Posts
            let responseArray = []
            posts.forEach(post => {
                post.forEach(ele => {
                    let obj = {}
                    obj.post = post
                    obj.interestShownBy = ele
                    if(ele.RequestAccepted) {
                        responseArray.push(obj)
                    }
                })
            })
            response.status(200).json({
                message: responseArray
            })
        }
    })
})


// router.post('/business/completeOrder', middleware, (request, response) => {
    // Business.updateOne({
    //     Email: request.decode.email,
    //
    // })
// })

module.exports = router
