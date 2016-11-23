"use strict";
var	jade = require('pug')

function templating(filePathOrOptions){
	switch(typeof filePathOrOptions){
		case 'string':
			this.options = {filePath:filePathOrOptions}
			break;

		default:this.options = filePathOrOptions || {}
	}
	return this;
}

templating.prototype.compile = function(){
	return jade.compileFile(this.options.filePath, this.options)
}

templating.prototype.render = function(locals){
	return jade.renderFile(this.options.filePath, locals)
}

module.exports = function(filePathOrOptions){
	return new templating(filePathOrOptions)
}