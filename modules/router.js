"use strict";

var ack = require('../index.js'),
		morgan = require('morgan'),
		multer = require('multer'),
		bodyParser = require('body-parser'),//used to parse inbound request form post variables
		multiparty = require('multiparty'),//used to parse inbound request form multi/part post variables
		cors = require('cors'),//controls cross origin requests
		upj = require('ua-parser-js'),
		connectTimeout = require("connect-timeout"),
		compression = require('compression')


var isProNode = process.env.NODE_ENV && process.env.NODE_ENV.toUpperCase()==='PRODUCTION'

module.exports.cacheFor = function(seconds){
	return function(req, res, next) {
		res.setHeader('Cache-Control','public, max-age='+seconds)
	  if(next)next();
	}
}

module.exports.notFound = function(){
	return function(req, res, next) {
		var reqres = ack.reqres(req,res)
	  var reqPath = reqres.path().string
	  var error = ack.error().types.notFound('Not Found - '+reqPath)

	  if(next){
	  	next(error);
	  }else{
			reqres.throw(error)
	  }
	}
}

module.exports.timeout = function(ms, options){
	return connectTimeout(ms, options)
}

/** GZIP requests. See npm compression */
module.exports.compress = function(options){
	return compression(options)
}

/** options{origin:'url-string'}. No options means allow all. See package cors */
module.exports.cors = function(options){
	return cors(options)
}

module.exports.relocate = function(url){
	return function(req, res, next){
  	ack.reqres(req, res).relocate(url)
	}
}

module.exports.ignoreFavors = function(){
	return function(req, res, next) {
    if(/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(req.url)){
      res.status(404).end();
    }else if(next){
      next()
    }
  }
}

module.exports.ignoreFavIcon = module.exports.ignoreFavors
module.exports.htmlCloseError = htmlCloseError

/**
	@options {debug:true/false, debugLocalNetwork:true}
*/
function htmlCloseError(options){
	options = options || {}
	options.debugLocalNetwork = options.debugLocalNetwork==null ? true : options.debugLocalNetwork
	return function(err, req, res, next){
		var msg = err.message || err.code
		res.statusCode = err.status || err.statusCode || 500
		res.statusMessage = msg
		res.setHeader('Content-Type','text/html')
		res.setHeader('message', msg)
		var output = '<h3>'+msg+'</h3>'//message meat
    var isDebug = options.debug || (options.debugLocalNetwork && ack.reqres(req,res).req.isLocalNetwork());

		if(isDebug){
			var dump = {Error:err}
			var jErr = ack.error(err)
			if(err.stack){
				output += jErr.getFirstTrace()
				dump.stack = jErr.getStackArray()
			}
		}else{
			var dump = err
		}

		output += ack(dump).dump('html')
		res.end(output)
	}
}

/**
	@options {debug:true/false, debugLocalNetwork:true}
*/
function jsonCloseError(options){
	options = options || {}
	options.debugLocalNetwork = options.debugLocalNetwork==null ? true : options.debugLocalNetwork
	return function(err, req, res, next){
	  try{
			var msg = err.message || err.code
			res.statusCode = err.status || err.statusCode || 500
			res.statusMessage = msg
			res.setHeader('message',msg)

	    var rtn = {
	      error: {
	        message: msg,
	        code: res.statusCode,
					"debug": {
						"stack": err.stack
					}
	      }
	    }

	    var isDebug = err.stack && (options.debug || (options.debugLocalNetwork && ack.reqres(req,res).req.isLocalNetwork()));
	    if(isDebug){
	      rtn.error.stack = err.stack//debug requests will get stack traces
	    }

	    res.end( JSON.stringify(rtn) );
	  }catch(e){
	    console.error('ack/modules/reqres/res.js jsonCloseError failed hard')
	    console.error(e)

	    if(next){
	      next(err)
	    }else{
	      throw err
	    }
	  }
	}
}
module.exports.jsonCloseError = jsonCloseError


/** error router with crucial details needed during development  */
module.exports.closeDevErrors = function(){
	return function(err, req, res, next){
		var isHtml = ack.reqres(req,res).isHtml()

		if( isHtml ){
			htmlCloseError({debug:true})(err,req,res)
		}else{
			jsonCloseError({debug:true})(err,req,res)
		}
	}
}

/** conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown */
module.exports.closeProductionErrors = function(){
	return function processError(err, req, res, next){
		try{
			var rtn = {
				error: {
					message: err.message,
					code: err.code
				}
			}

			res.status(err.status || 500).json(rtn);
		}catch(e){
			console.log('error-router.js failed',e)

			if(next){
				next(err)
			}else{
				throw err
			}
		}
	}
}

module.exports.consoleNonProductionErrors = function(options){
	if(isProNode){
		return function(req,res,next){
			next()
		}
	}

	return function(err,req,res,next){
		console.error('\x1b[33m---DEV REQUEST ERROR ---\x1b[00m')
		var jErr = ack.error(err)
		console.error(err)
		var shortTrace = jErr.getTraceArray(6)
		if(shortTrace && shortTrace.length)console.error(shortTrace)
		next(err)
	}
}

/** upgrades a url variable into an Authorization header */
module.exports.urlVarAsAuthHeader = function(varName){
	return function(req, res, next){
		try{
				var inputVar = ack.reqres(req,res).input.url(varName)
				if(inputVar){
					inputVar = decodeURIComponent(inputVar)//remove url formatting
					req.headers.authorization = 'Bearer '+inputVar;//make available as the Authorization header
				}
				next()
		}catch(e){
			next(e)
		}
	}
}

/** upgrades a cookie variable into an Authorization header */
module.exports.cookieAsAuthHeader = function(varName){
	return function(req, res, next){
		try{
				var inputVar = ack.reqres(req,res).input.cookie(varName)
				if(inputVar){
					inputVar = decodeURIComponent(inputVar)//remove url formatting
					req.headers.authorization = 'Bearer '+inputVar;//make available as the Authorization header
				}
				next()
		}catch(e){
			next(e)
		}
	}
}

/**
	@options - {
		requestKeyName: 'auth'//where parsed data will live (aka as requestProperty)
	}
*/
module.exports.jwt = function(secret,options){
	options = options || {}
	options.requestKeyName = options.requestKeyName || options.requestProperty || 'auth'

	var unauthError = ack.error().types.unauthorized()
	var expireError = ack.error().types.unauthorized('session has expired')

	return function(req,res,next){
		var authBearer = ack.reqres(req,res).req.input().getAuthBearer()
		if(!authBearer){
			return next( unauthError )
		}

		var jwt = ack.jwt(authBearer, secret, options)

		/* check expiration */
			var jwtData = jwt.decode();

			if(jwt.isExpireDefined()){
				if(jwt.isExpired()){
					return next(expireError)
				}
			}
		/*	*/

		jwt.verify().return().then(next).catch(next)
	}
}

/**
	request-end result logging. see npm morgan
	default dev format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
	default pro format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'

	format url-short is a custom morgan.token()
	format colored-status is a custom morgan.token()
*/
module.exports.logging = function(format,options){
	if(!format){
		var pro = ':colored-status :url-short :colored-method :res[content-length] :response-time ms :remote-addr :remote-user :device-name :browser-name'
		format = isProNode?pro:pro//'dev';
	}

	return morgan(format,options)
}

/** creates req.files array
	@options - see function paramUploadOptions
*/
module.exports.uploadByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).array(name)
}

/** throws 405 errors on request */
module.exports.methodNotAllowed = function(message){
	return this.throw( ack.error().types.methodNotAllowed(message) )
}

/** throws 400 errors on request */
module.exports.throw = function(ErrorOrMessage){
	if(ErrorOrMessage){
		if(ErrorOrMessage.constructor==String){
			ErrorOrMessage = ack.error().types.badRequest(ErrorOrMessage)
		}
	}else{
		ErrorOrMessage = ack.error().types.badRequest()
	}

	return function(req, res, next){
		if(next){//this router doesn't have to be used with express or connect packages which employ the next method
			next( ErrorOrMessage )
		}else{
			ack.reqres(req,res).throw(ErrorOrMessage)
		}
	}
}

/**  */
module.exports.parseBody = function(options){
	options = options || {}
	return function(req,res,next){
	  var promise = ack.promise()
	  .callback(function(callback){
	    bodyParser.urlencoded({extended:true})(req, res, callback)
	  })
	  .callback(function(callback){
	    bodyParser.json()(req, res, callback)
	  })
	  .callback(function(callback){
	    bodyParser.json({type: 'application/vnd.api+json'})(req, res, callback)
	  })

	  //null/undefined to empty-string
	  if(options.nullAsEmptyString){
	    promise = promise.then( ack ).call('nullsToEmptyString')
	  }

	  promise.return().then(next).catch(next)
	}
}

/**
	creates request.body which contains all form post fields
	NOTE: Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
*/
module.exports.parseMultipartFields = function(){
	var form = new multiparty.Form()
	return function(req,res,next){
		var isMulti = ack.reqres(req,res).req.isMultipart()

		if(!isMulti)return next();

		form.parse(req,function(err,fields,files){
			if(err)return next(err)

			req.body = req.body || {}
			for(var x in fields){
				req.body[x] = fields[x][0]
			}

			next()
		})
	}
}

/** creates req[name] file
	@options - see function paramUploadOptions
	NOTES:
		- Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
		- Any BODY/POST variables will be parsed and made available as req.body
*/
module.exports.uploadOneByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).single(name)
}

/** creates req[name] array
	@options - see function paramUploadOptions
	NOTES:
	- Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
	- Any BODY/POST variables will be parsed and made available as req.body
*/
module.exports.uploadArrayByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).array(name)
}

module.exports.localNetworkOnly = function(message){
	var LocalNetworkRequired = new ack.error().types.LocalNetworkRequired
	return function(req,res,next){
		var isLocalNetwork = ack.reqres(req,res).req.isLocalNetwork()

		if(!isLocalNetwork){
			next( new LocalNetworkRequired(message) )
		}

		next()
	}
}

/** for more see npm module
	@options {
		storage:multer.memoryStorage()
		putSingleFilesInArray:true
	}
*/
function paramUploadOptions(options){
	options = options || {}
	options.storage = options.storage || multer.memoryStorage()
	options.putSingleFilesInArray = options.putSingleFilesInArray===null ? true : options.putSingleFilesInArray
}








morgan.token('colored-method',function(req,res){
	var method = req.method

	if(method){
		var color = 0
		switch( method.toLowerCase() ){
			case 'delete':
	  		color = 31 // red
				break;

			case 'options':
		  		color = 33 // yellow
					break;

			case 'post':
	  		color = 32 // green
				break;

			case 'pull':
	  		color = 36 // cyan
				break;
		}

		return '\x1b['+color+'m'+method+'\x1b[0m'
	}

	return method
})

morgan.token('browser-name',function(req,res){
	var userAgent = ack.reqres(req,res).input.header('User-Agent')
	var parsed = upj(userAgent)
	return parsed.browser.name
})

morgan.token('device-name',function(req,res){
	var userAgent = ack.reqres(req,res).input.header('User-Agent')
	var parsed = upj(userAgent)
	return parsed.device.name
})

morgan.token('url-short',function(req,res){
	var url = req.orginalUrl || req.url
	url = url.replace(/(=[^=&]{5})[^=&]+/g,'$1...')
	return url
})

morgan.token('colored-status',function(req,res){
	var status = res.statusCode

	if(status){
	  var color = status >= 500 ? 31 // red
	    : status >= 400 ? 33 // yellow
	    : status >= 300 ? 36 // cyan
	    : status >= 200 ? 32 // green
	    : 0 // no color

		return '\x1b['+color+'m'+status+'\x1b[0m'
	}

	return status
})