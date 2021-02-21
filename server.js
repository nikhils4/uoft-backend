// dotenv config
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
//const cors = require('cors')

// requiring local files
const open = require('./Routes/open');
const auth = require('./Routes/userAuth');
const bussinessAuth = require('./Routes/businessAuth');
const userUtility = require('./Routes/userUtility');
const businessUtility = require('./Routes/businessUtility');
const businessProfile = require('./Routes/businessProfile');
const businessPost = require('./Routes/businessPost');
const restOfBusiness = require('./Routes/RestOfBusiness');

// initialisation
const app = express();

// CORS fix
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    next();
});
//app.use(cors())

//db connect
require('./Database/connection.js');

// presets
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// port declaration
const port = process.env.PORT || 3500;

// open routes
app.use('/', open)
app.use('/auth', auth)
app.use('/auth', bussinessAuth)
app.use('/utility', userUtility)
app.use('/utility', businessUtility)
app.use('/business', businessProfile)
app.use('/', businessPost)
app.use('/res', restOfBusiness)


// Init the server
app.listen( port, () => {
    console.log('Sever is up port')
})
