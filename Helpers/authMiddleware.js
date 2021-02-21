const jwt = require('jsonwebtoken');

module.exports.session = (request, response, next) => {
    const token = request.get('Authorization');
    if (token) {
        jwt.verify(token, process.env.PW_SECRET, (error, decode) => {
            console.log(error)
            if (error) {
                response.status(401).json({
                    status: 401,
                    err: 'Authentication failed (unable to authenticate access token)',
                });
            } else {
                request.decode = decode
                next()
            }
        });
    } else {
        response.status(401).json({
            status: 401,
            err: 'Unauthorised access',
        });
    }
};