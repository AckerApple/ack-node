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

/** returns middleware that sets cache-control header for every request */
module.exports.cacheFor = function(seconds){
	return function(req, res, next) {
		res.setHeader('Cache-Control','public, max-age='+seconds)
	  if(next)next();
	}
}

/** returns middleware that throws 404 file not found errors */
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

/** returns middleware that forces requests to timeout. Uses npm connect-timeout */
module.exports.timeout = function(ms, options){
	return connectTimeout(ms, options)
}

/** returns string to requests */
module.exports.respond = function(string, options){
	let type = 'text/plain'
	
	if(typeof string!='string'){
		type = 'application/json'
		string = JSON.stringify(string)
	}

	var eTag = ack.etag(string)

	return function(req,res,next){
		var noMatchHead = ack.reqres(req,res).input.header('If-None-Match')

		if(noMatchHead == eTag){
			res.statusCode = 304
			res.statusMessage = 'Not Modified'
			res.end()
		}else{
			res.setHeader('ETag', eTag)
			res.setHeader('Content-Length', string.length)
			res.setHeader('Content-Type', type)
			res.end(string)
		}
	}
}

/** returns middleware that GZIP requests. See npm compression */
module.exports.compress = function(options){
	return compression(options)
}

/** returns middleware for cross orgin services
	@options{
		origin:'*',
		maxAge: 3000//Access-Control-Allow-Max-Age CORS header default 50 minutes
	}
*/
module.exports.cors = function(options){
	options = options || {}
	
	//prevent subsequent OPTIONS requests
	options.maxAge = options.maxAge==null ? 3000 : options.maxAge

	return cors(options)
}

/** return middleware that pushes requests to a new url */
module.exports.relocate = function(url){
	return function(req, res, next){
  	ack.reqres(req, res).relocate(url)
	}
}

/** returns middleware that 404s requests matching typical fav.ico files */
module.exports.ignoreFavors = function(statusCode){
	statusCode = statusCode || 404
	return function(req, res, next) {
    if(/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(req.url)){
      res.status(statusCode).end();
    }else if(next){
      next()
    }
  }
}
module.exports.ignoreFavIcon = module.exports.ignoreFavors

/** returns middleware that closes errors with crucial details needed during development  */
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

/** returns middleware that conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown */
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

/** returns middleware that conditions errors returned to provide useful responses with exact detail specifics on excepetions thrown */
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

/** returns middleware that upgrades a url variable into an Authorization header */
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

/** returns middleware that upgrades a cookie variable into an Authorization header */
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

/** returns middleware that handles the processing of JWT
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

/** returns middleware that makes server logging colorful and useful
	request-end result logging. see npm morgan
	default dev format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
	default pro format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'

	format url-short is a custom morgan.token()
	format colored-status is a custom morgan.token()

	@options{
		stream - Output stream for writing log lines, defaults to process.stdout
	}
*/
module.exports.logging = function(format,options){
	if(!format){
		var pro = ':colored-status :url-short :colored-method :res[content-length] :response-time ms :remote-addr :remote-user :device-name :browser-name'
		format = isProNode?pro:pro//'dev';
	}

	return morgan(format,options)
}

/** returns middleware that uploads files. Creates req.files array
	@options - see function paramUploadOptions
*/
module.exports.uploadByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).array(name)
}

/** returns middleware that throws 405 errors on request */
module.exports.methodNotAllowed = function(message){
	return this.throw( ack.error().types.methodNotAllowed(message) )
}

/** returns middleware that throws 400 errors on request */
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

/** returns middleware that parses request bodies */
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

/** returns middleware that parse multi-part requests. Creates request.body which contains all form post fields
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

/** returns middleware that uploads only one file. Creates req[name] file
	@options - see function paramUploadOptions
	NOTES:
		- Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
		- Any BODY/POST variables will be parsed and made available as req.body
*/
module.exports.uploadOneByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).single(name)
}

/** returns middleware that uploads an array of files. Creates req[name] array
	@options - see function paramUploadOptions
	NOTES:
	- Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
	- Any BODY/POST variables will be parsed and made available as req.body
*/
module.exports.uploadArrayByName = function(name, options){
	options = paramUploadOptions(options)
	return multer(options).array(name)
}

/** returns middleware that only allows local network requests */
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

//MODULES AS INLINE FUNCTIONS
module.exports.htmlCloseError = htmlCloseError
module.exports.jsonCloseError = jsonCloseError








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


/** Returns universal error handler middleware
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

/** returns middleware that handles errors with JSON style details
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

	    var rtn = {
	      error: {
	        message: msg,
	        code: res.statusCode,
					"debug": {
						"stack": err.stack
					}
	      }
	    }

			var output = JSON.stringify(rtn)
			res.setHeader('message',msg)
			res.setHeader('Content-Type','application/json')
			res.setHeader('Content-Length',output.length)

	    var isDebug = err.stack && (options.debug || (options.debugLocalNetwork && ack.reqres(req,res).req.isLocalNetwork()));
	    if(isDebug){
	      rtn.error.stack = err.stack//debug requests will get stack traces
	    }

	    res.end( output );
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