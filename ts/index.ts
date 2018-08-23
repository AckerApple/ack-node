import { ack } from "ack-x"
import { dump } from "nodedump"
import * as path from "path"

export interface ackType{
  error       ? : any
  number      ? : any
  string      ? : any
  binary      ? : any
  base64      ? : any
  method      ? : any
  array       ? : any
  object      ? : any
  queryObject ? : any
  week        ? : any
  month       ? : any
  year        ? : any
  date        ? : any
  time        ? : any
  function    ? : any
	
	promise?:any//ack-p
}

export interface lazyack extends ackType{
  crypto?     : any
  jwt?        : any
	file?       : any
	path?       : any
  templating? : any
}

declare const global: any;
export const ackX:lazyack = <any>ack

const modulesPath = path.join(__dirname,'modules')

/* practically direct package access */
	ackX["modules"].definePath('crypto', path.join(modulesPath,'crypto.js'))
	//ackX["modules"].definePath('jade', path.join(modulesPath,'jade.js'))
/* end */

ackX["modules"].definePath('ip', path.join(modulesPath,'ip.js'))
ackX["modules"].definePath('jwt', path.join(modulesPath,'Jwt.js'))
ackX["modules"].definePath('reqres', path.join(modulesPath,'reqres.js'))
ackX["modules"].definePath('router', path.join(modulesPath,'router.js'))
ackX["modules"].definePath('req', path.join(modulesPath,'req.js'))
ackX["modules"].definePath('file', path.join(modulesPath,'File.js'))
ackX["modules"].definePath('path', path.join(modulesPath,'Path.js'))
ackX["modules"].definePath('dsc', path.join(modulesPath,'dsc','dsc.js'))
ackX["modules"].definePath('scheduler', path.join(modulesPath,'scheduler.js'))
ackX["modules"].definePath('reqres', path.join(modulesPath,'reqres.js'))
ackX["modules"].definePath('req', path.join(modulesPath,'req.js'))

/** offers functionality for rendering pug/jade like templates string */
ackX["modules"].definePath('templating', path.join(modulesPath,'templating.js'))

/** one time quic qay to render file-by-path and returns jade string */
ackX["modules"].define('template', function(filePath, locals){
	return ackX["templating"](filePath).render(locals)
})

ackX["modules"].definePath('mail', path.join(modulesPath,'Mail.js'))

import * as etag from "etag"
ackX["etag"] = etag
/**
	@options - {
		label,expand,top,levels
		hideTypes:['Function']//array of strings. String = constructor type name
	}
*/
ackX["prototype"].dump = function(format,options){
	if(format && format.constructor==Object){
		options = format
		format = options.format || 'json'
	}
	format = format ? format : 'json'

	switch(format.toLowerCase()){
		case 'html':return dump(this.$var, options)

		default:return JSON.stringify(this.$var)
	}
}

/** detects process.env.NODE_ENV */
ackX["isProductionMode"] = function(){
	return (process.env.NODE_ENV || 'development').toLowerCase() == 'production'
}

/** console log a significant message about logic that has been deprecated */
ackX["deprecated"] = function(msg){
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
	var trace = ackX["error"](new Error()).getStackArray()[3]
	console.warn('\x1b[33m->'+trace+'\x1b[00m')
}