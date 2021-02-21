const router = require('express').Router()
const User = require('../Database/Models/models').user
const middleware = require('../Helpers/authMiddleware').session;
const helpers = require('../Helpers/helpers')
const Business = require('../Database/Models/models').business
const triggerEmail = require('../Helpers/mailer').triggerEmail
const Email = require('../Database/Models/models').email
const {v4: uuidv4} = require('uuid')


router.post('/user/follow', middleware, (request, response) => {
    const follower = request.decode.email
    const following = request.body.id
    console.log('Following comes here, ', follower, following)
    // add the restaurant to the following array in the user schema
    User.findOne({
        Email: follower
    }, (err, userData) => {
        if(err){
       response.status(200).json({
                error: 'There was some error'
            })
        } else {

            Business.findOneAndUpdate({
                Email: following
            }, {
                $push: {
                    Followers: userData
                }
            }, {
                new: true
            })
                .then(doc => {

                    User.findOneAndUpdate({
                        Email: follower
                    }, {
                        $push: {
                            Following: doc
                        }
                    }, {
                        new: true
                    })
                        .then(data => {
                            response.status(200).json({
                                message: 'Successfully followed'
                            })
                        })
                        .catch(err => {
                            response.status(200).json({
                                error: 'There was some error'
                            })
                        })

                })
                .catch(err => {
                    response.status(200).json({
                        error: 'There was some error'
                    })
                })
        }
    })
})


// search for {Speciality and city then province}
router.get('/search/business', middleware, (request, response) => {
    User.findOne({
        Email: request.decode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error'
             })
         } else {
             if (request.query.search) {
                const regex = new RegExp(request.query.search, 'gi');
                Business.find({
                    Speciality: regex,
                }, function(err, businesses) {
                    if(err) {
                        response.status(200).json({
                            error: 'There was some error'
                        })
                    } else {
                        response.status(200).json({
                            message: businesses
                        })
                    }
                });
             }
        }
    })
})


router.get('/feed/get', middleware, (request, response) => {
    User.findOne({
        Email: request.decode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error!'
            })
        } else {
            const following = data ? data.Following : []
            let posts = []

            following?.forEach( (ele) => {
                console.log('Element ', ele)
                let obj = {}
                obj.PostedBy = ele
                obj.Posts = []
                ele.Posts.forEach(post => {
                    obj.Posts.push(post)
                })
                posts.push(obj)
            })
            response.status(200).json({
                message: posts
            })
        }
    })
})

router.post('/placeOrder', middleware,(request, response) => {
    const fromEmail = request.decode.email
    const toEmail = request.body.email

    User.findOne({
        Email: request.decode.email
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: 'There was some error'
            })
        } else {
            const name = data.Name
            Business.findOne({
                Email: toEmail
            }, (err, busiData) => {
                if(err){
                    response.status(200).json({
                        error: 'There was some error'
                    })
                } else {
                    const token = uuidv4()
                    const text = `Hey ${busiData.Name}, \n${name} is Interested in your post \n\nTitle - ${request.body.title} \nMenu - ${request.body.postDesc}. \n\nComments from user:- \n${request.body.description}. \n\n
                     To Accept - https://avenoir.netlify.app/acceptOrder?token=${token}\n\n
                     To Reject - https://avenoir.netlify.app/rejectOrder?token=${token}
                     \n\nBest,\nTeam Avenoir`
                    triggerEmail('Avenoir avenoireats@outlook.com', toEmail, 'Yayyy! You recieved an order!', text)
                        .then(doc => {
                            const dat = {
                                Id: token,
                                To: request.decode.email,
                                Restaurant: busiData.Name
                            }
                            const first = new Email(dat)
                            first.save((err) => {
                                if(err){
                                    response.status(200).json({
                                        error: err
                                    })
                                } else {
                                    response.status(200).json({
                                        message: 'Successfully placed the order'
                                    })
                                }
                            })
                        })
                        .catch(err => {
                            response.status(200).json({
                                error: 'There was some error'
                            })
                        })
                }
            })
        }
    })

})


router.post('/acceptOrder', (request, response) => {
    const token = request.body.token
    const description = request.body.description
    Email.findOne({
        Id: token
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: err
            })
        } else {
            const toEmail = data.To
            const text = `Hey, \n${data.Restaurant} has accepted your order request. \n\nComments from restaurant:- \n${description}. \n\n
                     \n\nBest,\nTeam Avenoir`
            triggerEmail('Avenoir avenoireats@outlook.com', toEmail, 'Yayyy! Your order was accepted!', text)
                .then(doc => {
                    response.status(200).json({
                        message: 'Successfully accepted the order'
                    })
                })
                .catch(err => {
                    response.status(200).json({
                        error: 'There was some error'
                    })
                })
        }
    })
})


router.post('/rejectOrder', (request, response) => {
    const token = request.body.token
    const description = request.body.description
    Email.findOne({
        Id: token
    }, (err, data) => {
        if(err){
            response.status(200).json({
                error: err
            })
        } else {
            const toEmail = data.To
            const text = `Hey, \n${data.Restaurant} has rejected your order request. \n\nComments from restaurant:- \n${description}. \n\n
                     \n\nBest,\nTeam Avenoir`
            triggerEmail('Avenoir avenoireats@outlook.com', toEmail, 'Sorry! Your order was rejected!', text)
                .then(doc => {
                    response.status(200).json({
                        message: 'Successfully rejected the order'
                    })
                })
                .catch(err => {
                    response.status(200).json({
                        error: 'There was some error'
                    })
                })
        }
    })
})


module.exports = router