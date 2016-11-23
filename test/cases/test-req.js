var ack = require('../../index.js'),
	assert = require('assert'),
	http = require('http'),
	reqTester = require('../requestTester'),
	fs = require('fs'),
	packPath = require.resolve('../../package.json')

describe('req',function(){
	var server
	beforeEach(function(done){
		server = http.createServer(function(req, res){
			var rtn = {url:req.url, method:req.method}
			var close = function(){
				res.end( JSON.stringify(rtn) )
			}

			if(req.url.search(/upload/)){
				ack.router().uploadOneByName('file')(req,res)
				.then(()=>rtn.file=req.file)
				.then(close)
			}else{
				ack.router().parseBody()(req,res).then(close)
			}
		}).listen(3000, done)
	})

	afterEach(function(done){
		server.close()
		done()
	})

	it('get',function(done){
		ack.req('0.0.0.0:3000').send()
		.then(function(body, response){
			reqTester(body, response)

			assert.equal(body.constructor, String)
			body = JSON.parse(body)
			assert.equal(body.url, '/')
		})
		.then(done).catch(done)
	})

	describe('#post',()=>{
		it('#upload',function(done){
			var file = fs.createReadStream(packPath)

			ack.req('0.0.0.0:3000/upload')
			.addFile('file',file)
			.method('post')
			.send()
			.then(function(body, response){
				reqTester(body, response)
				assert.equal(body.constructor, String)
				body = JSON.parse(body)

				assert.equal(body.method, 'POST')
				assert.equal(typeof body.file, 'object')
				assert.equal(body.file.fieldname, 'file')
				assert.equal(body.file.originalname, 'package.json')
				assert.equal(typeof body.file.buffer, 'object')
				assert.equal(body.file.buffer.type, 'Buffer')
			})
			.then(done).catch(done)
		})
	})

	describe('#put',()=>{
		it('json',function(done){
			ack.req('0.0.0.0:3000').put({test:22})
			.then(function(body, response){
				reqTester(body, response)
				assert.equal(body.constructor, String)
				body = JSON.parse(body)
				assert.equal(body.method, 'PUT')
			})
			.then(done).catch(done)
		})
	})

	it('#delete',function(done){
		ack.req('0.0.0.0:3000').delete()
		.then(function(body, response){
			reqTester(body, response)
			assert.equal(body.constructor, String)
			body = JSON.parse(body)
			assert.equal(body.method, 'DELETE')
		})
		.then(done).catch(done)
	})

	it('repeated',function(done){
		var req = ack.req('0.0.0.0:3000')

		req.send('/test?test=1')
		.then(function(body, response){
			reqTester(body, response)
			assert.equal(body.constructor, String)
			body = JSON.parse(body)
			assert.equal(body.url, '/test?test=1&')
			return req.send('/test2?test2=2')
		})
		.then(function(body, response){
			reqTester(body, response)
			assert.equal(body.constructor, String)
			body = JSON.parse(body)
			assert.equal(body.url, '/test2?test2=2&')
		})
		.then(done).catch(done)
	})
})