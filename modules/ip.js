"use strict";

var IP = function(ip){
	this.ip = ip;return this
}

IP.prototype.isPrivate = function(){
  return this.ip.match(/^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
  this.ip.match(/^192\.168\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
  this.ip.match(/^172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
  this.ip.match(/^169\.254\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
  this.isHost(this.ip);
}

IP.prototype.isHost = function(){
  return this.ip.match(/^(::ffff:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
  this.ip.match(/^localhost/) != null ||
  this.ip.match(/^::1$/) != null ||
  this.ip.match(/^::$/) != null ||
  this.ip.match(/^fc00:/) != null || this.ip.match(/^fe80:/) != null;
}


module.exports = function(ip){return new IP(ip)}
