"use strict";

module.exports = function(entry, alga, key){
	return new Crypto({entry:entry, key:key})
}

var cryptojs = require('crypto-js')
var Crypto = function Crypto($scope){
	this.data = $scope || {}
	this.cryptojs = cryptojs
	return this
}

Crypto.prototype.MD5 = function(){
	return this.cryptojs.MD5(this.data.entry)
}

Crypto.prototype.md5 = function(){
	return this.MD5().toString()
}