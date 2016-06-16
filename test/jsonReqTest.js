"use strict";

var ack = require('../index.js')

console.log('loading')

var request = ack.req('0.0.0.0')

request.json({eggs:33}).send()
.then(function(body){
	console.log('sent')
	console.log(body)
})

console.log('loaded')