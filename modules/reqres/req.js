"use strict";
var	ack = require('../../index.js'),
	multiparty = require('multiparty'),//used to parse inbound request form multi/part post variables
	cookies = require('cookies'),
	url = require('url')

//Request Return : Object to handle processing request (process client input, uploads, paths)
var reqrtn = function(req,res){
	if(req && req._headers){
		throw new Error('Received response object where request object was expected');
	}

	this.req = req
	this.res = res
	this.data = {
		//localHostIpArray:['localhost','127.0.0.1','::1']
	}
	this.isClientInputLoaded = false
	return this
}

reqrtn.prototype.getMethod = function(){
	return this.req.method
}

reqrtn.prototype.getUserAgent = function(){
	return this.input().headers().get('User-Agent')
}

reqrtn.prototype.referer = function(){
	return this.input().headers().get('Referer')
}

reqrtn.prototype.getPort = function(){
	var cKey = this.req.socket.server._connectionKey
	return cKey.split(':').pop()
}

reqrtn.prototype.ip = function(ip){
	if(ip){
		/* reset all known places the ip address might be stored */
			if(this.req.connection){
				if(this.req.connection.remoteAddress){
					this.req.connection.remoteAddress = ip
				}

				if(this.req.connection.socket && this.req.connection.socket.remoteAddress){
					this.req.connection.socket.remoteAddress = ip
				}
			}
			if(this.req.socket && this.req.socket.remoteAddress){
				this.req.socket.remoteAddress = ip
			}
		/* end */

		return ip
	}

	if(this.req.connection){
		if(this.req.connection.remoteAddress){
			return this.req.connection.remoteAddress
		}

		if(this.req.connection.socket && this.req.connection.socket.remoteAddress){
			return this.req.connection.socket.remoteAddress
		}
	}
	if(this.req.socket && this.req.socket.remoteAddress){
		return this.req.socket.remoteAddress
	}
}

reqrtn.prototype.isLocalNetwork = function(yesNo){
	if(yesNo!=null){
		this.data.localNetwork = yesNo;
		return this.data.localNetwork
	}

	if(this.data.localNetwork!=null){
		return this.data.localNetwork;
	}

	var ip = this.ip()
	this.data.localNetwork = this.isLocalHost() || (ip && ack.ip(ip).isPrivate());
	return this.data.localNetwork
}

/** is current request from the local-box */
reqrtn.prototype.isLocalHost = function(yesNo){
	if(yesNo!=null){
		this.data.isLocalHost = yesNo;
		return this.data.isLocalHost
	}
	if(this.data.isLocalHost!=null){
		return this.data.isLocalHost
	}

	var ip = this.ip();
	if(ip && ip.toLowerCase){
		ip = ip.toLowerCase()
		this.data.isLocalHost = ack.ip(ip).isPrivate()//this.data.localHostIpArray.indexOf(ip) >= 0
		return this.data.isLocalHost;
	}

	return false
}

reqrtn.prototype.acceptsHtml = function(){
	var accept = this.input().headers().get('Accept')
	if(accept && accept.search('html')>=0){
		return true
	}

	return false
}

reqrtn.prototype.isHttps = function(){
	return this.req.connection!=null && this.req.connection.encrypted!=null
}

//request folder path
reqrtn.prototype.Path = function(){
	var p = new reqrtn.path(this.req)// || this.req.url
	this.Path = function(){return p}//morph to deliver cache
	return p
}

reqrtn.prototype.path = function(){
	ack.deprecated('reqrtn.path() deprecated. Use reqrtn.Path()')
	return this.Path()
}

reqrtn.prototype.relativePath = function(){
	return this.Path().relative
}

/** options={isHttps:true|false} */
reqrtn.prototype.absoluteUrl = function(options){
	options = options || {}
	var protocol = 'http'
	var isHttps = options.isHttps || this.isHttps()
	if(isHttps){
		protocol += 's';
	}
	var relPath = this.req.originalUrl || this.req.url || ''

	var port = ''
	if(options.port){
		port = ':'+ options.port
	}else{
		var myPort = this.getPort()
		if(typeof(options.port)=='undefined' && myPort!=80 && myPort!=443){
			port = ':'+ myPort
		}
	}

	var abUrl = protocol + '://' + this.getHostName() + port + relPath
	return abUrl
}

//www.websitename.com
reqrtn.prototype.getHostName = function(){
	if(this.req.vhost && this.req.vhost.hostname){
		return this.req.vhost.hostname
	}

	var host = this.getHost()
	return host.split(':').shift()
}
reqrtn.prototype.hostName = reqrtn.prototype.getHostName//deprecated naming convention

//www.websitename.com:80
reqrtn.prototype.getHost = function(){
	if(this.req.vhost && this.req.vhost.host){
		return this.req.vhost.host
	}

	return this.input().headers().get('host')
}

//client input
reqrtn.prototype.input = function(){
	//if(!this.data.clientInput)throw 'Client input not yet loaded'
	if(!this.data.clientInput){
		this.data.clientInput = new reqrtn.clientInput(this.req, this.res)
	}
	return this.data.clientInput
}
//deprecated reference
reqrtn.prototype.ci = reqrtn.prototype.input

reqrtn.prototype.loadClientInput = function(){
	return ack.promise()
	.bind(this)
	.then(function(){
		this.data.clientInput = new reqrtn.clientInput(this.req, this.res)

		if(!this.req.body){
			return this.data.clientInput.parseFormVars().bind(this).set(this.data.clientInput)
		}

		return this.data.clientInput
	})
}
reqrtn.prototype.clientInput = reqrtn.prototype.loadClientInput

/**
	client file upload
	returns promise of upload result
*/
reqrtn.prototype.uploadByName = function(name, options){
	return ack.promise().bind(this).callback(function(next){
		ack.router().uploadByName(name,options)(this.req, this.res, next)
	})
	.then(function(){
		return this.req.files
	})
}

/** returns promise of upload result */
reqrtn.prototype.uploadOneByName = function(name, options){
	return ack.promise().bind(this).callback(function(next){
		ack.router().uploadOneByName(name,options)(this.req, this.res, next)
	})
	.then(function(){
		if(this.req[name])return this.req[name]
	})
}

reqrtn.prototype.isMultipart = function(){
	var ct = this.input().headers().get('content-type')
	return ct && (ct=='multipart/form-data' || ct.substring(0, 9)=='multipart') ? true : false
}





//!!!Non-prototypes below

//express request handler with array shifting
reqrtn.processArray = function(req, res, nextarray){
	if(!nextarray || !nextarray.length)return
	var proc = nextarray.shift()
	proc(req, res, function(){
		reqrtn.processArray(req,res,nextarray)
	})
}


//path component to aid in reading the request path
reqrtn.path = function(req){
	var oUrl = req.originalUrl || req.url
	this.string = oUrl.split('?')[0]
	this.relative = req.url.split('?')[0]
	return this
}

reqrtn.path.prototype.getString = function(){
	return this.string
}

reqrtn.path.prototype.array = function(){
	var s = this.string.trim().split('/')
	while(typeof(s[0]) != 'undefined' && s[0].length==0)s.shift()//remove opening empty-strings
	while(typeof(s[s.length-1]) != 'undefined' && s[s.length-1].length==0)s.pop()//remove ending empty-strings
	return s
}


//client input object
reqrtn.ci = function(a){
	this.data = a || {}
	return this
}

reqrtn.ci.prototype.dump = function(options){
	return nodedump.dump(this.data,options)
}





//full client input (includes extra form & url original ref)
reqrtn.clientInput = function(req, res){
	this.req = req;this.res = res
	this.data = {}
	return this
}

reqrtn.clientInput.prototype.combined = function(){
	if(this.Combined){
		return this.Combined
	}

	this.Combined = ack.accessors()
	this.Combined.set( this.url().data )

	if(this.req.body){
		this.Combined.set(this.req.body)//form post vars pasted ontop url vars
	}

	return this.Combined
}

reqrtn.clientInput.prototype.combine = function(varsOrScopeName1, varsOrScopeName2, varsOrScopeName3){
	var combined = ack.accessors()
		,args = Array.prototype.slice.call(arguments)

	for(var x=0; x < args.length; ++x){
		if(args[x]){
			if(args[x].constructor==String){
				switch(args[x]){
					case 'query':case 'queries':case 'url':case 'urls':
						combined.set(this.req.query)
					break;

					case 'form':case 'forms':case 'body':case 'bodies':
						if(this.req.body){
							combined.set(this.req.body)//form post vars pasted ontop url vars
						}
					break;

					case 'cookie':case 'cookies':
						combined.set( this.cookies().all() )//form post vars pasted ontop url vars
					break;

					case 'header':case 'headers':
						combined.set( this.req.headers )//form post vars pasted ontop url vars
					break;
				}
			}else{
				combined.set(args[x])
			}
		}
	}

	return combined
}

reqrtn.clientInput.prototype.getAuthBearer = function(){
	var authString = this.headers().get('Authorization')
	if(authString){
		return authString.replace(/^[^ \r\n\t]+[ \r\n\t]/g,'')//Authorization: Bearer TOKEN_STRING
	}
}

reqrtn.clientInput.prototype.cookies = function(){
	if(this.Cookies)return this.Cookies
	this.Cookies = new cookies(this.req, this.res)
	this.Cookies.all = function(){
		if(this.request.headers.cookie){
			var data={}, rows=this.request.headers.cookie.split(';')

			if(rows.constructor==Array){
				rows.forEach(function(v,i){
					rows[i] = v.split(';')[0]
				})
			}

			rows.forEach(function(row,i){
				var twoPiece = row.split('=')
				data[twoPiece[0].trim()] = twoPiece.length>1 ? twoPiece[1].trim() : null
			})
			return data
		}
	}
	return this.Cookies
}

reqrtn.clientInput.prototype.headers = function(){
	if(this.Headers)return this.Headers
	this.Headers = ack.accessors(this.req.headers)// get/set methods and convenient dump method
	return this.Headers
}

reqrtn.clientInput.prototype.url = function(){
	if(this.Url){
		return this.Url
	}

	if(!this.req.query){//url variables already parsed
		var urlString = this.req.url || this.req.originalUrl
		this.req.query = url.parse(urlString, true).query
		ack( this.req.query ).nullsToEmptyString()
	}

	this.Url = ack.accessors(this.req.query)// get/set methods and convenient dump method
	return this.Url
}

reqrtn.clientInput.prototype.multipart = function(){
	if(this.Multipart)return this.Multipart
	if(!this.req.body){
		throw new Error('multipart form variables have not yet been parsed! req.body is '+typeof(this.req.body));
	}
	this.Multipart = ack.accessors(this.req.body)// get/set methods and convenient dump method
	return this.Form
}

reqrtn.clientInput.prototype.form = function(){
	if(!this.req.body){
		var msg = 'form variables have not yet been parsed! req.body is '+typeof(this.req.body)+'. req is '+typeof(this.req)
		throw new Error(msg);
	}
	this.Form = ack.accessors(this.req.body)// get/set methods and convenient dump method
	this.form = function(){return this.Form}
	return this.Form
}

/** returns promise - {fields},{files}
 Warning, once engaged during a request, no other multi-part parser will be able to see the multi-part
*/
reqrtn.clientInput.prototype.parseMultiPart = function(){
	var Form = new multiparty.Form()
	return ack.promise().set(this.req).bind(Form).callback(Form.parse)
}

/** all multipart fields are added to request.body */
reqrtn.clientInput.prototype.mergeBodyAndMultipart = function(nullAsEmptyString){
	var promise = ack.promise().bind(this)
	var isMultipart = new reqrtn(this.req, this.res).isMultipart()
	if(isMultipart){
		promise = promise.then(this.parseMultiPart)
		.then(function(fields, files){
			this.data.multipart = {fields:fields, files:files}
			for(var x in fields){
				this.req.body[x] = fields[x][0]
			}
		})

		//null/undefined to empty-string
		if(nullAsEmptyString===null || nullAsEmptyString){
			promise = promise.then( this.nullsToEmptyString )
		}
	}

	return promise
	.then(function(){
		if(!this.req.body){
			this.req.body = {}
		}

		return [this.form(), this.req.body]
	})
	.spread()//cast array to positional-arguments
}

reqrtn.clientInput.prototype.nullsToEmptyString = function(){
	ack(this.req.body).nullsToEmptyString()
}

//returns promise
reqrtn.clientInput.prototype.parseFormVars = function(nullAsEmptyString){
	return ack.promise().bind(this).callback(function(callback){
		ack.router().parseBody({
			nullAsEmptyString:nullAsEmptyString==null?true:nullAsEmptyString
		})(this.req,this.res,callback)
	})
  .then(function(){
    if(!this.req.body){//maybe bad idea to default the body
      this.req.body = {}
    }

    return [this.form(), this.req.body]
  })
  .spread()//cast array to positional-arguments
}


module.exports = reqrtn