var ack = require('../../index.js'),
	assert = require('assert'),
  http = require('http')

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

        ack.router().parseBody()(req,res,next)

      }
      server = http.createServer(onRequest).listen(3003,done);
    })

    afterEach(function(){
      server.close()
    })

    it('success',function(done){
      var bodyPost = {testVar:22}
      ack.req().post(bodyPost).send('localhost:3003/success-test')
      .then((body, res)=>{
        var mirror = JSON.parse(body)
        assert.equal(bodyPost.testVar, mirror.body.testVar)
      })
      .then(done).catch(done)
    })
  })
})