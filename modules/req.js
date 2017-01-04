"use strict";
var	ack = require('../index.js'),
	request = require('request'),//required to make outbound requests
	fs = require('fs'),
	querystring = require('querystring'),//used to turn js object to post form variables for outbound requests
	url = require('url')
	//,http = require('http')

//outbound request maker. See http.request. options:{host: 'localhost',port: '3000'}
var req = function($scope){
	this.options = ack.accessors({headers:{}})

	if($scope && $scope.constructor == String){
		this.options.data.uri = $scope
		$scope = {}
	}

	this.data = $scope || {}
	this.jsonArray = []
	this.posts = ack.accessors()
	this.cookies = ack.accessors()
	this.headers = ack.accessors()
	this.vars = ack.accessors()//url query variables
	return this
}

req.prototype.setAuthBearer = function(token){
	return this.header('Authorization','Bearer '+token)
}

req.prototype.setUrl = function(url){
	this.options.set('uri',url);return this
}

/** name,val or {name:val} */
req.prototype.option = function(){
	this.options.set.apply(this.options,arguments)
	return this
}

req.prototype.cookie = function(nameOrStruct, value){
	this.cookies.set.apply(this.cookies,arguments)
	return this
}

req.prototype.header = function(nameOrStruct, value){
	this.headers.set.apply(this.headers, arguments)
	return this
}

/** adds form post variables */
req.prototype.postVar = function(nameOrStruct, value){
	this.posts.set.apply(this.posts,arguments)
	return this
}

/** adds form post variables
	DEPRECATED: this should trigger a send
	TODO: convert into POST trigger instead of variable catcher
*/
//req.prototype.post = req.prototype.postVar

req.prototype.addFile = function(name, file){
	this.options.data = this.options.data || {}
	this.options.data.formData = this.options.data.formData || {}
	this.options.data.formData[name] = file
	return this
}

req.prototype.addFileByPath = function(name, path){
	this.options.data = this.options.data || {}
	this.options.data.formData = this.options.data.formData || {}
	this.options.data.formData[name] = fs.createReadStream(path)
	return this
}

req.prototype.json = function(value){
	this.jsonArray.push(value)
	return this
}

/** add query var */
req.prototype.var = function(nameOrStruct,value){
	this.vars.set.apply(this.vars,arguments)
	return this
}


req.prototype.getTransmissionOptions = function(){
	var ops = this.options.data,
			headers = this.headers

	/* headers */
		Object.keys(headers.data).forEach(function(v,i){
			ops.headers[v] = headers.data[v]
		})
	/* end: headers */

	/* cookies */
		var cookies = this.cookies.data
		var cookieString = ack.object(cookies).toCookieString()
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

	if(Object.keys(this.posts.data).length){
		ops.url = ops.uri//? this maybe just to report back to user the url ? Seems in the wrong place. Perhaps this is actually needed by request.post() ? (8/25/15)
		ops.form = this.posts.data
		//ops.formData = this.posts.data
	}

	ops.method = ops.method || (Object.keys(this.posts.data).length ? 'post' : 'get')

	return ops;
}

req.prototype.method = function(method){
	this.options.data.method = method
	return this
}

/** triggers request to send with method delete */
req.prototype.delete = function(address){
	this.options.data.method = 'del';
	return this.send(address)
}

/** triggers request to send with method post */
req.prototype.post = function(dataOrAddress, data){
	this.options.data.method = 'post';

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
	this.options.data.method = 'put';

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

/** triggers request to send */
req.prototype.send = function(address, options){
	var req,
		ops = this.getTransmissionOptions(),
		body = ''

	if(address){
		var orgUrl = ops.uri;
		ops.uri = ops.uri ? ops.uri += address : address
	}

	if(options)Object.assign(ops, options)

	this.preSendOps(ops)

	return ack.promise().bind(this)
	.callback(function(callback){
		req = request[ops.method.toLowerCase()](ops, callback)
	})
	.then(function(response, body){
		if(orgUrl){
			ops.uri = orgUrl
			ops.url = orgUrl
		}
		return [response, req, body]
	})
	.spread(this.procresreq)
	.spread()//array to func arg array for next promise
}

req.prototype.preSendOps = function(ops){
	/* url vars */
		ops.path = ops.path || ''
		var Uo = url.parse(ops.path,true)
		for(var x in this.vars.data){
			Uo.query[x] = this.vars.data[x]
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

module.exports = function(urlOrScope){
	return new req(urlOrScope)
}