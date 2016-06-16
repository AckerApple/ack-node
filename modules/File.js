"use strict";
var fs = require('fs'),
	ack = require('../index.js'),
	mime = require('mime')

var File = function(path){
	this.path = path
	return this
}

//callback(error,result)
File.prototype.requireIfExists = function(){
	var path = this.path

	return ack.promise()
	.next(function(next){
		this.ifExists(function(){
			next(require(path))
		},function(){
			next()
			/*
			var e = new Error()
			e.name = 'FileNotFound'
			next.promise.throw(e)
			*/
		})
	},this)
}

File.prototype.readJson = function(){
	return this.readAsString().then(JSON.parse)
}
File.prototype.getJson = File.prototype.readJson//aka

File.prototype.ifExists = function(cb,els){
	els = els||function(){}
	cb = cb||function(){}

	this.exists()
	.if(true,cb,this)
	.if(false,els,this)

	return this
}

File.prototype.Path = function(){
	return ack.path(this.path).join('../')
}

//recursively creates paths
File.prototype.paramDir = function(options){
	return this.Path().paramDir().set(this)
}

File.prototype.stat = function(){
	return ack.promise().set(this.path).callback(fs.stat)
}

File.prototype.getMimeType = function(){
	return mime.lookup(this.path)
}

File.prototype.read = function(){
	return ack.promise().set(this.path).callback(fs.readFile)
}

File.prototype.readAsString = function(){
	return this.read().call('toString')
}

File.prototype.getName = function(){
	return this.path.replace(/^.+[\\/]+/g,'')
}

File.prototype.append = function(output){
	return ack.promise().set(this.path, output).callback(fs.appendFile)
}

File.prototype.write = function(output){
	return ack.promise().set(this.path,output).callback(fs.writeFile).then(function(){return this},this)
}


File.prototype.delete = function(){
	return ack.promise().set(this.path).callback(function(r, callback){
		ack.promise().set(r).callback(fs.unlink).then(callback)
		.catch('ENOENT',function(){//file did not exists, no big deal
			callback()
		})
	})
}

File.prototype.exists = function(cb){
	return ack.promise().set(this.path).next(fs.exists)
}

File.prototype.sync = function(){
	return new FileSync(this.path)
}





//synchron
var FileSync = function FileSync(path){
	this.path = path
	return this
}

FileSync.prototype.read = function(){
	return fs.readFileSync(this.path)
}

FileSync.prototype.write = function(string,options){
	fs.writeFileSync(this.path, string, options);return this
}

FileSync.prototype.delete = function(){
	fs.unlinkSync(this.path);return this
}

FileSync.prototype.exists = function(){
	return fs.existsSync(this.path)
}

FileSync.prototype.readJson = function(){
	var contents = this.read()
	return JSON.parse(contents)
}

module.exports = function(path){return new File(path)}
module.exports.Class = File
