var ack = require('../../index.js').ackX,
	assert = require('assert'),
	key = 'key'

describe('ack.#jwt',function(){
	it('inits',function(){
		ack.jwt({some:'data',hello:'world'})
	})

	describe('methods',function(){
		var jwt, payload
		beforeEach(function(){
			payload = {some:'data',hello:'world'}
			jwt = ack.jwt(payload,key)
		})

		it('#sign',function(){
			jwt.sign()
			assert.equal(typeof(jwt.data.payload),'object')
			assert.equal(typeof(jwt.data.token),'string')
		})

		it('#decode',function(){
			var $payload = jwt.tokenize().decode()
			assert($payload.hello, payload.hello)
			assert.equal(typeof(jwt.data.payload),'object')
			assert.equal(typeof(jwt.data.token),'string')
		})

		it('#verify',function(done){
			jwt.tokenize().verify()
			.then(function($payload){
				assert($payload.hello,payload.hello)
				assert.equal(typeof(jwt.data.payload),'object')
				assert.equal(typeof(jwt.data.token),'string')
			})
			.then(done).catch(done)
		})

		it('fullback',function(done){
			var token = jwt.sign()

			var $payload = ack.jwt(token,key).decode()
			assert($payload.hello,payload.hello)

			ack.jwt(token,key).verify()
			.then(function($payload){
				assert($payload.hello,payload.hello)
				assert.equal(typeof(jwt.data.payload),'object')
				assert.equal(typeof(jwt.data.token),'string')
			})
			.then(done).catch(done)
		})
	})
})