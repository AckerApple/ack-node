"use strict";
var nodemailer = require('nodemailer'),
	ack = require('../index.js')

/**
	@connectionProps - {
		pool - if set to true uses pooled connections (defaults to false), otherwise creates a new connection for every e-mail.
		direct - if set to true, bypasses MTA relay and connects directly to recipients MX. Easier to set up but has higher chances of ending up in the Spam folder
		service - can be set to the name of a well-known service so you don't have to input the port, host, and secure options (see Using well-known services)
		port - is the port to connect to (defaults to 25 or 465)
		host - is the hostname or IP address to connect to (defaults to 'localhost')
		secure - if truethe connection will only use TLS. If false (the default), TLS may still be upgraded to if available via the STARTTLS command.
		ignoreTLS - if this is true and secure is false, TLS will not be used (either to connect, or as a STARTTLS connection upgrade command).
		requireTLS - if this is true and secure is false, it forces Nodemailer to use STARTTLS even if the server does not advertise support for it.
		tls - defines additional node.js TLSSocket options to be passed to the socket constructor, eg. {rejectUnauthorized: true}.
		auth - defines authentication data (see authentication section below)
		authMethod - defines preferred authentication method, eg. 'PLAIN'
		name - optional hostname of the client, used for identifying to the server
		localAddress - is the local interface to bind to for network connections
		connectionTimeout - how many milliseconds to wait for the connection to establish
		greetingTimeout - how many milliseconds to wait for the greeting after connection is established
		socketTimeout - how many milliseconds of inactivity to allow
		logger - optional bunyan compatible logger instance. If set to true then logs to console. If value is not set or is false then nothing is logged
		debug - if set to true, then logs SMTP traffic, otherwise logs only transaction events
		maxConnections - available only if pool is set to true. (defaults to 5) is the count of maximum simultaneous connections to make against the SMTP server
		maxMessages - available only if pool is set to true. (defaults to 100) limits the message count to be sent using a single connection. After maxMessages messages the connection is dropped and a new one is created for the following messages
		rateLimit - available only if pool is set to true. (defaults to false) limits the message count to be sent in a second. Once rateLimit is reached, sending is paused until the end of the second. This limit is shared between connections, so if one connection uses up the limit, then other connections are paused as well
	}

	@mailOptions - {
    from: '', // sender address
    to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
    subject: 'Hello', // Subject line
    text: 'Hello world', // plaintext body
    html: '<b>Hello world</b>' // html body
	}
*/
var Mail = function(connectionProps, mailOptions){
	this.connectionProps = connectionProps || {}
	this.mailOptions = mailOptions || {}
	return this
}

Mail.prototype.send = function(){
	return ack.promise()
	.set(this.connectionProps, this.mailOptions)
	.callback(function(connectionProps, mailOptions, callback){
		var transport = nodemailer.createTransport(connectionProps)
		transport.sendMail(mailOptions, function(err, info){
			callback(err, info)
		})
	})
}

module.exports = function(connectionProps, mailOptions){
	return new Mail(connectionProps, mailOptions)
}
