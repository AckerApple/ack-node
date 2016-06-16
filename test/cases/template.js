"use strict";
var ack = require('../../index.js'),
	assert = require('assert'),
	path = require('path'),
  hWorldPath = path.join(__dirname,'../','assets','viewroute','helloWorld.jade')

describe('ack.templating',function(){
  it('ack.template',function(){
    var jadePath = hWorldPath,
        result = ack.template(jadePath, {inout:'22'})
    assert.equal(result, 'hello world 22')
  })

  it('#comile',function(){
    var jadePath = hWorldPath,
        result = ack.templating(jadePath).compile()({inout:'22'})
    assert.equal(result, 'hello world 22')
  })

})