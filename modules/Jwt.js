"use strict";
var jx = require('ack-x')
	,jsonwebtoken = require('jsonwebtoken')

var Jwt = function Jwt($scope){
	this.data = $scope || {}
	this.data.options = this.data.options || {}
	this.data.options.algorithm = this.data.options.algorithm || 'HS256'
	this.data.expireKeyName = 'exp'
	this.jsonwebtoken = jsonwebtoken
	return this
}

//encrypts data into token
Jwt.prototype.sign = function(){
	this.data.options = this.data.options || {}

	if(!this.data.options.expiresIn){
		this.data.options.expiresIn = '240m'//4 hours
	}

	this.data.key = this.data.key.replace(/\r\n/g,'\n')//all line returns to unix

	this.data.token = jsonwebtoken.sign(this.data.payload, this.data.key, this.data.options)
	return this.data.token
}

Jwt.prototype.isExpireDefined = function(){
	var data = this.decode()
	var keyName = this.data.expireKeyName
	if(!data || !data[keyName] || isNaN(data[keyName])){
		return false;
	}

	return true;
}

Jwt.prototype.isExpired = function(){
	if(!this.isExpireDefined())return true;

	var data = this.decode()
	var keyName = this.data.expireKeyName
	var exp = data[keyName]

	/* check expiration */
		var expDate = jx.date("January 1 1970 00:00:00").addSeconds(exp).date;
		if(expDate.getTime() <= new Date().getTime()){
			return true;//expired
		}
	/* end: expiration */
	return false;
}

Jwt.prototype.decode = function(){
	this.data.token = decodeURIComponent(this.data.token)//incase token was made cookie or url var
	return jsonwebtoken.decode(this.data.token, this.data.options)
}

Jwt.prototype.tokenize = function(){
	this.sign();return this
}

//returns promise of decoded data only if verified
Jwt.prototype.verify = function(){
	if(typeof(this.data.token)!='string'){
		throw new Error('Cannot verify json-web-token. Token is not string (received:'+typeof(this.data.token)+')')
	}

	if(!this.data.key || typeof(this.data.key)!='string')
		throw new Error('Cannot verify json-web-token. Key is not string (received:'+typeof(this.data.key)+')')

	this.data.key = this.data.key.replace(/\r\n/g,'\n')//all line returns to unix
	this.data.token = decodeURIComponent(this.data.token)//incase token was made cookie or url var

	return jx.promise()
	.set([this.data.token, this.data.key, this.data.options])
	.bind(jsonwebtoken)
	.spreadCallback(jsonwebtoken.verify)
}

module.exports = function(data, key, options){
	return new Jwt({token:data, payload:data, key:key, options:options})
}