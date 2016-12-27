var ack = require('../../index.js'),
	assert = require('assert'),
  http = require('http'),
  path = require('path'),
  packPath = require.resolve('../../package.json')
  uploadPackPath = path.join(__dirname,'package.json')

describe('router',function(){
	it('loads',function(){
		ack.router()
	})

  it('#errorsToArray',()=>{
    const options = {array:[]}
    const router = ack.router().errorsToArray(options)
    router(new Error('request error'), {}, {}, ()=>0)
    assert.equal(options.array.length, 1)
    const loopArray = new Array(65)//65 errors will occur but only 25 should exist
    for(let x=loopArray.length-1; x >= 0; --x){
      router(new Error('request error'), {}, {}, ()=>x)
    }
    assert.equal(options.array.length, 25)
  })

  describe('body-parsing',function(){
    var server, logArray, logger

    beforeEach(function(done){
      logArray = []
      logger = ack.router().logToArray({array:logArray, maxLength:5})
      
      var onRequest = function(req,res){
        var next = function(err){
          ack.reqres(req,res).sendJSON({body:req.body})
        }

        logger(req,res,()=>{})

        if(req.url.search(/\/upload-package-directly/)>=0){
          var uploadPath = uploadPackPath
          ack.router().uploadOneByNameToPath('file',uploadPath)(req,res,next)
        }else if(req.url.search(/\/upload/)>=0){
          var uploadPath = path.join(uploadPackPath,'../')
          ack.router().uploadOneByNameToPath('file',uploadPath)(req,res,next)
        }else{
          ack.router().parseBody()(req,res,next)
        }
      }
      server = http.createServer(onRequest).listen(3003,done);
    })

    afterEach(function(){
      server.close()
    })

    it('success',done=>{
      var bodyPost = {testVar:22}
      ack.req().post('localhost:3003/success-test',bodyPost)
      .then(body=>assert.equal(bodyPost.testVar, body.body.testVar))
      .then(done).catch(done)
    })

    it('logArray',done=>{
      var bodyPost = {testVar:22}
      ack.req().post('localhost:3003/success-test',bodyPost)
      .then(body=>{
        assert.equal(logArray.length, 1)

        let x=20
        const promises = []

        while(x>0){
          promises.push( ack.req().post('localhost:3003/success-test',bodyPost) )
          //console.log(x)
          --x
        }
        
        return ack.promise().all(promises)
      })
      .then(()=>{
        assert.equal(logArray.length, 5)//even though we made 25 requests, only 5 should be in array log
      })
      .then(done).catch(done)
    })

    describe('uploadOneByNameToPath',()=>{
      it('filePath',done=>{
        ack.req()
        .addFileByPath('file',packPath)
        .send('localhost:3003/upload-package-directly')
        .then((body, res)=>{
          return ack.path(uploadPackPath).exists()
        })
        .then(result=>assert.equal(result, true))
        .then(()=>ack.path(uploadPackPath).delete())
        .then(done).catch(done)
      })

      it('path',done=>{
        ack.req()
        .addFileByPath('file', packPath)
        .send('localhost:3003/upload')
        .then((body, res)=>{
          return ack.path(uploadPackPath).exists()
        })
        .then(result=>assert.equal(result, true))
        .then(()=>ack.path(uploadPackPath).delete())
        .then(done).catch(done)
      })
    })
  })
})