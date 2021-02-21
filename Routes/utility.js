const router = require('express').Router()

// interlinking of cuisines to their restaurants
router.get('/cuisines', (request, response) => {
    response.status(200).json({
        message: 'Route for linking cuisines'
    })
})

module.exports = router