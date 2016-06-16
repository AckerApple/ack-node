var assert = require('assert')
	,path = require('path')
	,ack = require('../../index')

describe('ack.path',function(){
	var tarDir,assestsPath,mockPath,mockPathArray,mockPathNameArray
		,configPaths = function(){
			tarDir = path.join(__dirname,'../../')
			assestsPath = path.join(__dirname,'../assets')+path.sep
			mockPath = assestsPath+'MockFolder'
			mockPathArray = ['SomeFile.js','SomeFolder'+path.sep,'SomeFolder'+path.sep+'SomeFolderFile.js']
			mockPathNameArray = ['SomeFile.js','SomeFolder','SomeFolderFile.js']
		}

	beforeEach(configPaths)

	it('#removeExt',function(){
		assert.equal(ack.path('/test/file.js').removeExt().path, '/test/file')
		assert.equal(ack.path('/test/file').removeExt().path, '/test/file')
	})

	it('#removeFile',function(){
		assert.equal(ack.path('/test/file.js').removeFile().path, '/test/')
		assert.equal(ack.path('/test/').removeFile().path, '/test/')
	})

	describe('#each',function(){
		it('path-array-compare',function(done){
			ack.path(mockPath)
			.each(function(name,i){
				assert.equal(name,mockPathArray[i],'path name check')
			},{NON_RECURSIVE:false},function(){done()})
		})

		it('break-test',function(done){
			var repeater = function(name,i){
				assert.equal(i,0)//the return false below should prevent loop from continuing
				return false
			}
			//should only loop once
			ack.path(mockPath).each(repeater,{NON_RECURSIVE:false},function(){done()}).catch(done)
		})
	})

	//Node path.join only allows string, this test would fail if numbers not casted to string
	it('numbers-to-string',function(){
		ack.path(mockPath).join(22)
	})

	it('#upEach',function(){
		ack.path(__dirname)
		.upEach(function(Path){
			assert.equal(typeof(Path),'object')
			assert.equal(typeof(Path.path),'string')
		})
	})

	it('#eachPath',function(done){
		var ops = {NON_RECURSIVE:false}
		var repeater = function(Path,i){
			assert.equal(Path.getName(),mockPathNameArray[i],'Path.name check')
		}
		var closer = function(){
			done()
		}

		ack.path(mockPath).eachPath(repeater,ops,closer).catch(done)
	})

	it('#recurRequirePath',function(done){
		ack.path(mockPath).recurRequirePath()
		.then(function(fileResultArray, fileResultPathArray){
			assert.notEqual(0,fileResultArray.length)
			for(var x=fileResultArray.length-1; x >= 0; --x){
				assert.equal(typeof fileResultArray[x],'string','module.exports')
			}
		})
		.then(done).catch(done)
	})

	it('#nextSubDir',function(done){
		var ackFound = false
		ack.path(tarDir).new.join('../')
		.nextSubDir(function(Path,i,next){
			assert.equal(Path.sync().exists(),true)
			if(Path.sync().exists('index.js')){
				ackFound=true
			}
			next()
		}).then(function(dirNameArray){
			assert.equal(ackFound,true)
		})
		.then(done).catch(done)
	})

	it('#eachSubDirName',function(done){
		var ackFound = false
		ack.path(tarDir)
		.new.join('../').eachSubDir(function(Path,i){
			assert.equal(Path.sync().exists(),true)
			if(Path.sync().exists('index.js')){
				ackFound=true
			}
		},function(dirNameArray){
			try{
				assert.equal(ackFound,true)
				done()
			}catch(e){done(e)}
		})
	})

	it('#ifExists',function(done){
		ack.path(assestsPath)
		.ifExists('MockFolder',function(){
			done()
		},function(){
			throw 'MockFolder does not exist'
		})
	})

	it('#require',function(done){
		ack.path(assestsPath)
		.require('PathRequireTest.js')
		.then(function(r){
			assert.equal(r.success,true,'PathRequireTest.js was required')
		})
		.then(done)
		.catch(done)
	})

	it('#param',function(done){
		var Path = ack.path(assestsPath).join('paramPathTest0','paramPathTest1','paramPathTest2')
		Path.param()
		.then(function(){
			assert.equal(Path.sync().exists(),true,'path was not succesfully created')
		})
		.then(done).catch(done)
	})

	it('#delete',function(done){
		var Path = ack.path(assestsPath).join('paramPathTest0')
		Path.delete()
		.then(function(){
			assert.equal(Path.sync().exists(),false,'path was not succesfully deleted')
		})
		.then(done).catch(done)
	})
})