var ack = require('../../index.js'),
	assert = require('assert')

describe('ack.#crypto',function(){
	it('inits',function(){
		ack.crypto('my string for hashing')
	})

	describe('methods',function(){
		it('#MD5',function(){
			assert.equal( ack.crypto('mytest').md5(), 'a599d36c4c7a71ddcc1bc7259a15ac3a')
		})
	})
})