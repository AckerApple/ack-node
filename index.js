"use strict";
var ack = require('ack-x'),
	nodedump = require('nodedump').dump,
	path = require('path'),
	modulesPath = path.join(__dirname,'modules')

/* practically direct package access */
	ack.modules.definePath('crypto', path.join(modulesPath,'crypto.js'))
	ack.modules.definePath('jade', path.join(modulesPath,'jade.js'))
/* end */

ack.modules.definePath('ip', path.join(modulesPath,'ip.js'))
ack.modules.definePath('jwt', path.join(modulesPath,'Jwt.js'))
ack.modules.definePath('reqres', path.join(modulesPath,'reqres.js'))
ack.modules.definePath('router', path.join(modulesPath,'router.js'))
ack.modules.definePath('req', path.join(modulesPath,'req.js'))
ack.modules.definePath('file', path.join(modulesPath,'File.js'))
ack.modules.definePath('path', path.join(modulesPath,'Path.js'))
ack.modules.definePath('dsc', path.join(modulesPath,'dsc','dsc.js'))
ack.modules.definePath('scheduler', path.join(modulesPath,'scheduler.js'))
ack.modules.definePath('reqres', path.join(modulesPath,'reqres.js'))
ack.modules.definePath('req', path.join(modulesPath,'req.js'))

ack.modules.definePath('templating', path.join(modulesPath,'templating.js'))
/** renders and returns jade string */
ack.modules.define('template', function(filePath, locals){
	return ack.templating(filePath).render(locals)
})

ack.modules.definePath('mail', path.join(modulesPath,'Mail.js'))

//
ack.etag = require('etag')
/**
	@options - {
		label,expand,top,levels
		hideTypes:['Function']//array of strings. String = constructor type name
	}
*/
ack.Expose.prototype.dump = function(format,options){
	if(format && format.constructor==Object){
		options = format
		format = options.format || 'json'
	}
	format = format ? format : 'json'

	switch(format.toLowerCase()){
		case 'html':return nodedump(this.$var, options)

		default:return JSON.stringify(this.$var)
	}
}

/** detects process.env.NODE_ENV */
ack.isProductionMode = function(){
	return (process.env.NODE_ENV || 'development').toLowerCase() == 'production'
}

/** console log a significant message about logic that has been deprecated */
ack.deprecated = function(msg){
	if(global.deprecatedMessages && global.deprecatedMessages[msg]){
		return//msg has already been logged once
	}

	global.deprecatedMessages = global.deprecatedMessages || {}
	global.deprecatedMessages = msg
	/*
	https://en.wikipedia.org/wiki/ANSI_escape_code

	color number lookup (red:31,green:32) - http://ascii-table.com/ansi-escape-sequences.php
	\x1b[31m - red
	\x1b[32m - green
	\x1b[33m - yellow
	\x1b[34m - blue
	\x1b[30m - black
	\x1b[00m - reset
	*/
	var modMsg = '\x1b[33m'+msg+'\x1b[00m'//yellow then back to black
	console.warn(modMsg)
	var trace = ack.error(new Error()).getStackArray()[3]
	console.warn('\x1b[33m->'+trace+'\x1b[00m')
}

module.exports = ack
