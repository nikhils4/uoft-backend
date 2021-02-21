const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: process.env.MG_API_KEY, domain: process.env.MG_DOMAIN});

// in mailgun > domains > select sandbox domain > select api > nodejs and copy the code

const triggerEmail = (sender, to, subject, text) => {
	const data = {
		from: sender,
		to,
		subject,
		text
	};

	// Promise makes sure you get some type response. 
	// this creates a promise (basically async)
	return new Promise(function(resolve, reject) {
		mg.messages().send(data, function (error, body) {
			if(error){
				reject(error)
			} else {
				resolve(body)
			}
		});
	})
}

// const assure = new Promise((resolve, reject) => {
// 	// query db here ----------> 2secs 
// 	profile.save((err, data) => {
// 		if(err) {
// 			reject(err)
// 		} else {
// 			resolve(data)
// 			// data = "Kajal"
// 		}
// 	})
// )

// assure
// 	.then(res => {
// 		console.log(res ====> data)
// 	})
// 	.catch(err1 => {
// 		console.log(err1)
// 	})
// 	.finally(() => {
// 		console.log('Yayayyya we did something')
// 	})


//const name = responsefromDB;

module.exports.triggerEmail = triggerEmail