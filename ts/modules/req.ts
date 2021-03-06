import { ackX } from "../index"

var	request = require('request')//required to make outbound requests
var	fs = require('fs')
var	querystring = require('querystring')//used to turn js object to post form variables for outbound requests
var	url = require('url')
	//,http = require('http')

/** outbound request maker. See http.request.
	@options{
		host: String,
		port: Number,
		spread:true - by default the promise is (response, request, response.body) but can be (response)
	}
*/
var req = function($scope){
	this.options = {headers:{}}

	if($scope && $scope.constructor == String){
		this.options.uri = $scope
		$scope = {}
	}

	this.data = $scope || {}
	this.jsonArray = []
	this.posts = {}
	this.cookies = {}
	this.headers = {}
	this.vars = {}//url query variables
}

/** set options
	@options - name or object of option(s)
	@value - when @options is string, then value is required
*/
req.prototype.set = function(options, value){
	if(!options)return

	if(options.constructor==Object){
		Object.assign(this.options, options)
	}else{
		this.options[options] =  value
	}

	return this
}

req.prototype.setAuthBearer = function(token){
	return this.header('Authorization','Bearer '+token)
}

req.prototype.setUrl = function(url){
	this.options.uri = url;
	return this
}

/** name,val or {name:val} */
req.prototype.option = function(name:string|object, value:any){
	setter(name, value, this.options)
	return this
}

req.prototype.cookie = function(name:string|object, value:any){
	setter(name, value, this.cookies)
	return this
}

req.prototype.header = function(name:string|object, value:any){
	setter(name, value, this.headers)
	return this
}

/** adds form post variables */
req.prototype.postVar = function(name:string|object, value:any){
	setter(name, value, this.posts)
	return this
}

/** adds form post variables
	DEPRECATED: this should trigger a send
	TODO: convert into POST trigger instead of variable catcher
*/
//req.prototype.post = req.prototype.postVar

req.prototype.addFile = function(name, file){
	this.options = this.options || {}
	this.options.formData = this.options.formData || {}
	this.options.formData[name] = file
	return this
}

req.prototype.addFileByPath = function(name, path){
	this.options = this.options || {}
	this.options.formData = this.options.formData || {}
	this.options.formData[name] = fs.createReadStream(path)
	return this
}

req.prototype.json = function(value){
	this.jsonArray.push(value)
	return this
}

/** add query var */
req.prototype.var = function(
	name   : string|object,
	value? : any
){
	if( typeof(name)==="object" ){
		for(let x in name){
			this.vars[x] = name[x]
		}
	}else{
		this.vars[name] = value
	}
	return this
}


req.prototype.getTransmissionOptions = function(){
	var ops = this.options,
			headers = this.headers

	/* headers */
		Object.keys(headers).forEach(function(v,i){
			ops.headers[v] = headers[v]
		})
	/* end: headers */

	/* cookies */
		var cookies = this.cookies
		var cookieString = ackX.object(cookies).toCookieString()
		if(cookieString.length){
			ops.headers['Cookie'] = cookieString
		}
	/* end: cookies */

	if(this.jsonArray.length){
		if(this.jsonArray.length > 1){
			ops.multipart = ops.multipart || []
			for(var jIndex=0; jIndex < this.jsonArray.length; ++jIndex){
				var body = JSON.stringify( this.jsonArray[jIndex] )
				ops.multipart.push({
					accept: 'application/json',
					'Content-Type':'application/json',
					'Content-Length':body.length,
					body : body
				})
			}
		}else{
			ops.json = this.jsonArray[0]
		}
	}

	if(!ops.uri){
		if(ops.url){
			ops.uri = ops.url//auto correct url to uri
		}else{
			ops.uri = ''
		}
	}

	if(Object.keys(this.posts).length){
		ops.url = ops.uri//? this maybe just to report back to user the url ? Seems in the wrong place. Perhaps this is actually needed by request.post() ? (8/25/15)
		ops.form = this.posts
		//ops.formData = this.posts
	}

	ops.method = ops.method || (Object.keys(this.posts).length ? 'post' : 'get')

	return ops;
}

req.prototype.method = function(method){
	this.options.method = method
	return this
}

/** triggers request to send with method delete */
req.prototype.delete = function(address){
	this.options.method = 'del';
	return this.send(address)
}

/** triggers request to send with method post */
req.prototype.post = function(dataOrAddress, data){
	this.options.method = 'post';

	if(dataOrAddress && dataOrAddress.constructor == String){
		if(data){
			this.json(data)
		}
		return this.send(dataOrAddress)
	}

	if(data){
		this.json(data)
	}

	return this.send()
}

/** triggers request to send with method put */
req.prototype.put = function(dataOrAddress, data){
	this.options.method = 'put';

	if(dataOrAddress && dataOrAddress.constructor == String){
		if(data){
			this.json(data)
		}
		return this.send(dataOrAddress)
	}

	if(data){
		this.json(data)
	}

	return this.send()
}

/**
	triggers request to send
	@options{
		spread:true - by default the promise is (response, request, response.body) but can be (response)
	}
*/
req.prototype.send = function(address, options){
	var req,
		ops = this.getTransmissionOptions(),
		body = ''

	if(address){
		var orgUrl = ops.uri;
		ops.uri = ops.uri ? ops.uri += address : address
	}

	options = options || {}
	Object.assign(ops, options)

	this.preSendOps(ops)

	let promise = ackX.promise().bind(this)
	.callback(function(callback){
		req = request[ops.method.toLowerCase()](ops, callback)
	})

	const spread = ops.spread==null ? this.options.spread : ops.spread
	if(spread==null || spread){
		promise = promise
		.then(function(response, body){
			if(orgUrl){
				ops.uri = orgUrl
				ops.url = orgUrl
			}
			return [response, req, body]
		})
		.spread(this.procresreq)
		.spread()//array to func arg array for next promise
	}else{
		promise = promise.then((response,body)=>response)
	}

	return promise
}

req.prototype.preSendOps = function(ops){
	/* url vars */
		ops.path = ops.path || ''
		var Uo = url.parse(ops.path,true)
		for(var x in this.vars){
			Uo.query[x] = this.vars[x]
		}

		var append = url.format(Uo)
		if(ops.uri.search(/\?/)>=0){
			append = '&' + append.substring(1, append.length);//remove opening ?
		}

		ops.uri += append
	/* end */

	if(ops.uri.search(/(^\/\/\/|:\/\/)/)<0){
		ops.uri = 'http://'+ops.uri
	}

}

req.prototype.procresreq = function(res, req, body){
	//add convenience method that parses cookies
	res.getCookieObject = function(){
		if(!this.headers || !this.headers['set-cookie'])return {}
		var data={}, rows=this.headers['set-cookie']

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

	return [body, res, req]
}

export function method(urlOrScope){
	return new req(urlOrScope)
}

function setter(name:string|object, value:any, data){
	if( name && name.constructor===String ){
		data[ <string>name ] = value
		return
	}

	Object.assign(data, name)
}