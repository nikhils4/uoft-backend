
const router = require("express").Router();

router.get( '/', (request, response) => {
    response.status(200).json({
        message : "This is the default route for the Avenoir Project API"
    })
})

router.get( '/team', (request, response) => {
    response.status(200).json({
        message : "The project is built by Nikhil, Kajal and Isaac"
    })
})

module.exports = router;