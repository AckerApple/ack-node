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

  describe('body-parsing',function(){
    var server

    beforeEach(function(done){
      var onRequest = function(req,res){
        var next = function(err){
          ack.reqres(req,res).sendJSON({body:req.body})
        }

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
      ack.req().post(bodyPost).send('localhost:3003/success-test')
      .then((body, res)=>{
        var mirror = JSON.parse(body)
        assert.equal(bodyPost.testVar, mirror.body.testVar)
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