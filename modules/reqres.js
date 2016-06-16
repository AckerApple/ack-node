"use strict";
var Req = require('./reqres/req')
var Res = require('./reqres/res')
var ack = require('../index.js')

var reqres = function reqres(req, res, $scope){
	this.data = $scope || {}

	var iReq = new Req(req, res)
	var iRes = new Res(res, req)
	this.req = iReq
	this.res = iRes

	this.input.header = function(name){
		var module = iReq.input().headers()
		return name ? module.get(name) : module
	}
	this.input.headers = this.input.header//multi-ref

	this.input.cookie = function(name){
		var module = iReq.input().cookies()
		return name ? module.get(name) : module
	}
	this.input.cookies = this.input.cookie//multi-ref

	this.input.url = function(name){
		var module = iReq.input().url()
		return name ? module.get(name) : module
	}
	this.input.multipart = function(name){
		var module = iReq.input().multipart()
		return name ? module.get(name) : module
	}
	this.input.form = function(name){
		var module = iReq.input().form()
		return name ? module.get(name) : module
	}

	return this
}

/* res */
	reqres.prototype.setStatus = function(code, message){
		this.res.res.statusCode = code
		this.res.res.statusMessage = message
		return this
	}

	reqres.prototype.output = function(anything){
		return this.res.append.apply(this.res,arguments)
	}

	reqres.prototype.dump = function(output, options){
		return this.res.dump(output, options)
	}

	reqres.prototype.throw = function(err){
		if(err && err.constructor==String){//convert error string to error object with a more correct stack trace
			arguments[0] = new Error(arguments[0])
			ack.error(arguments[0]).cutFirstTrace()
		}
		return this.res.throw.apply(this.res,arguments)
	}

	reqres.prototype.relocate = function(url, statusMessage, statusCode){
		return this.res.relocate.apply(this.res,arguments)
	}


	reqres.prototype.sendHTML = function(output, options){
		return this.res.sendHtml.apply(this.res,arguments)
	}
	reqres.prototype.sendHtml = reqres.prototype.sendHTML

	reqres.prototype.sendJSON = function(output, options){
		return this.res.sendJSON.apply(this.res,arguments)
	}
	reqres.prototype.sendJson = reqres.prototype.sendJSON

	reqres.prototype.abort = function(output, options){
		return this.res.abort.apply(this.res,arguments)
	}

	//has the response been put into HTML mode? default=acceptsHtml()
	reqres.prototype.isHtml = function(yN){
		return this.res.isHtml(yN)
	}
/* end: res */

/* req */
	reqres.prototype.path = function(){
		return this.req.Path()
	}

	reqres.prototype.ip = function(){
		return this.req.ip()
	}

	reqres.prototype.url = function(){
		return this.req.absoluteUrl()
	}

	reqres.prototype.acceptsHtml = function(){
		return this.req.acceptsHtml()
	}

	reqres.prototype.getHostName = function(){
		return this.req.getHostName()
	}

	reqres.prototype.input = function(name){
		var module = this.req.input().combined()
		return name ? module.get(name) : module
	}
/* end: req */

module.exports = function(req, res){
	return new reqres(req, res)
}