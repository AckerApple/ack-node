var ack = require('../../index.js').ackX,
		assert = require('assert'),
		http = require('http')

describe('reqres',function(){
	var req, res, ReqResOb

	beforeEach(function(){
		req = {
			originalUrl:'foo-test-website.com',
			headers:{
				'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Encoding':'gzip, deflate',
				'Accept-Language':'en-US,en;q=0.5',
				'Cache-Control':'max-age=0',
				'Connection':'keep-alive',
				'Cookie':'ackID=foo.rap;',
				'Host':'foowebsite.com:3000',
				'Referer':'https://foowebsite.com/',
				'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:37.0) Gecko/20100101 Firefox/37.0'
			},
			connection:{
				remoteAddress:'127.0.0.1'
			}
		}
		res = {}
		ReqResOb = ack.reqres(req, res)
	})

	it('#isHttps',function(){
		assert.equal(ReqResOb.req.isHttps(), false)
	})

	it('#isHtml',function(){
		assert.equal(ReqResOb.isHtml(), true)
	})

	it('#acceptsHtml',function(){
		assert.equal(ReqResOb.acceptsHtml(), true)
	})

	it('#getHost',function(){
		assert.equal(ReqResOb.req.getHost(), req.headers.Host)
	})

	it('#hostName',function(){
		assert.equal(ReqResOb.req.hostName(), req.headers.Host.split(':').shift())
	})

	it('#isLocalHost',function(){
		assert.equal(ReqResOb.req.isLocalHost(), true)

		var ip = '::ffff:127.0.0.1'
		ReqResOb.req.ip(ip)//change request ip address
		assert.equal(ReqResOb.req.ip(), ip)
		assert.equal(ReqResOb.req.isLocalHost(), true)
	})

	it('#isLocalNetwork',function(){
		assert.equal(ReqResOb.req.isLocalNetwork(), true)
	})

	describe('input',function(){
		it('#input',function(){
			var inputData = ReqResOb.input().data
			assert.equal(inputData.constructor, Object)

			inputData.Test = 33
			assert.equal(ReqResOb.input('test'), 33)
			assert.equal(ReqResOb.input().get('test'), 33)
		})

		it('#header',function(){
			var inputData = ReqResOb.input.headers().data
			assert.equal(inputData.constructor, Object)

			assert.equal(ReqResOb.input.headers('cAchE-cOnTrOl'), req.headers['Cache-Control'])
			assert.equal(ReqResOb.input.headers().get('cache-control'), req.headers['Cache-Control'])
		})
	})

	it('#absoluteUrl',function(){
		var req = {
				socket:{
					server:{
						_connectionKey:'http://cloud.alwayscloseby.com:80'
					}
				},
				headers:{
					'Host':'cloud.alwayscloseby.com:80'
				}
			}

		var reqres = ack.reqres(req)
		assert.equal(reqres.req.getPort(), 80)

		var abUrl = reqres.req.absoluteUrl({isHttps:true});

		assert.equal(abUrl, 'https://cloud.alwayscloseby.com')
	})

	describe('port-3001',function(){
		this.timeout(4000)
		var server,req,res,reqres
		beforeEach(function(done){
			function closeReqRes(){
				try{
					var data = {
						body:req.body,
						forms:reqres.input.form().data,
						isMultipart:reqres.req.isMultipart()
					}

					reqres.sendJSON(data)
/*
					var json = JSON.stringify(data)
					res.setHeader('content-type','application/json')
					res.end(json)
*/
				}catch(e){
					done(e)
				}
			}

			server = http.createServer(function(request,response){
				req = request
				res = response
				reqres = ack.reqres(req,res)

				if(reqres.path().string=='/etag-test'){
					return reqres.etag({test:22})
				}

				reqres.req.input().parseFormVars().then(closeReqRes)
			}).listen(3001,done)
		})

		it('server-reponds',function(done){
			ack.req().send('localhost:3001')
			.then(function(body,response){
				assert.equal(response.statusCode, 200)
				assert.equal(response.headers['content-type'], 'application/json')
			})
			.then(done).catch(done)
		})

		it('post',function(done){
			ack.req().postVar({testVar:22}).send('localhost:3001')
			.then(function(body,response){
				body = JSON.parse(body)
				assert.equal(body.isMultipart, false)
				assert.equal(body.forms.testVar, 22)
			})
			.then(done).catch(done)
		})

		it('etag',function(done){
			var etag=0

			ack.req().send('localhost:3001/etag-test')
			.then(function(body,response){
				assert.equal(body, '{"test":22}')
				assert.equal(response.headers.etag, '"b-0+CD2vvpRIv9sP/0NTat4KWwtNM"')
				assert.equal(response.headers['content-type'], 'application/json')
				assert.equal(response.headers['content-length'], 11)
				etag = response.headers.etag
			})
			.then(()=>{
				return ack.req().header('If-None-Match',etag).send('localhost:3001/etag-test')
			})
			.then(function(body,response){
				assert.equal(response.statusCode, 304)
				assert.equal(response.statusMessage, 'Not Modified')
			})
			.then(done).catch(done)
		})

		afterEach(function(done){
			server.close(done)
		})
	})
})