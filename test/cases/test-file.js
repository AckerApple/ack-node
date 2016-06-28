"use strict";
var ack = require('../../index.js'),
	path = require('path'),
	assert = require('assert')

describe('ack.file',function(){
	var	OneRequire,tenFilePath,TenFile,TenFileSync,ReturnOneFile,rtnOneFilePath,FileNotFound

	beforeEach(function(){
		tenFilePath = path.join(__dirname,'test','10CharFile.txt')
		rtnOneFilePath = path.join(__dirname,'../','assets/returnOne.js')
		ReturnOneFile = ack.file(rtnOneFilePath)
		FileNotFound = ack.file(rtnOneFilePath+'s')
		TenFile = ack.file(tenFilePath)
		OneRequire = ack.file(tenFilePath)
		TenFileSync = ack.file(tenFilePath).sync()
	})

	it('#removeExt',function(){
		var p = ack.file(__dirname).join('test.js').removeExt().path
		assert.equal(p, path.join(__dirname,'test'))
	})

	it('#join',function(){
		var F1 = ack.file(__dirname)
		F1.join('acker')
		assert.equal(F1.path, path.join(__dirname,'acker'))
	})

	it('#Join',function(){
		var F1 = ack.file(__dirname)
		var F2 = F1.Join('acker')
		assert.equal(F2.path, path.join(F1.path,'acker'))
	})

	describe('#sync',function(){
		it('#readJson',function(){
			var jsonPath = path.join(__dirname,'../../package.json')
			var result = ack.file(jsonPath).sync().readJson()

			assert.equal(result.name, 'ack-node')
		})
	})

	it('#paramDir',function(done){
		TenFile.paramDir()
		.set(1234567890)
		.then(TenFile.write,TenFile)
		.then(TenFile.exists,TenFile)
		.if(false,function(){
			done(new Error('Ten File Did Not get created'))
		})
		.ifNext(true,function(next){
			TenFile.read().then(function(read){
				if(read.length!=10)throw new Error('expected written file length 10. Got '+read.length)
			})
			.then(TenFile.delete,TenFile)
			.then(next)
			.catch(next.throw)
		})
		.set().then(done).catch(done)
	})

	it('#getJson',function(done){
		var jsonPath = path.join(__dirname,'../../package.json')
		ack.file(jsonPath).getJson()
		.then(function(result){
			assert.equal(result.name, 'ack-node')
		})
		.then(done).catch(done)
	})

	it('#append',function(done){
		TenFile.append('abcdefghij').then(function(){
			assert.equal(TenFileSync.exists(),true,'file write/exists')

			var read = TenFileSync.read()

			assert.equal(read.length,10,'expected file length 10. Got '+read.length+' '+read)
		})
		.then(done).catch(done)
	})

	it('#write',function(done){
		TenFile.write(1234567890).then(function(){
			assert.equal(TenFileSync.exists(),true,'file write/exists')
			assert.equal(TenFileSync.read().length,10,'file length 10')
		})
		.then(done).catch(done)
	})

	it('#delete',function(done){
		TenFile.delete().then(function(){
			assert.notEqual(TenFileSync.exists(),true)
		})
		.then(done).catch(done)
	})

	it('#write#delete',function(done){
		TenFile.write('1234567890')
		.next(function(next){
			TenFile.delete().then(next)
		})
		.then(function(){
			assert.equal(TenFileSync.exists(),false,'path was not succesfully deleted')
		})
		.then(done).catch(done)
	})

	it('#requireIfExists',function(done){
		ReturnOneFile.requireIfExists()
		.then(function(result){
			if(result!=1)throw new Error('require result not equal 1');
		})
		.then(done).catch(done)
	})

	it('#requireIfExists-!exist',function(done){
		FileNotFound
		.requireIfExists()
		.then(function(result){
			if(result)throw 'not supposed to be called';
		})
		.then(done)
		.catch(done)
	})

	it('deleteTenFileDir',function(done){
		TenFile.Path().delete().then(done).catch(done)
	})

	it('#getMimeType',function(){
		var mimeType = ReturnOneFile.getMimeType()
		assert.equal(mimeType, 'application/javascript')
	})

	it('#stat',function(done){
		ReturnOneFile.stat().then(function(stats){
			assert.equal(stats.size!=null,true)
		})
		.then(done).catch(done)
	})
})