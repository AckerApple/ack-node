"use strict";
module.exports = function(body, response){
  if(response.statusCode!=200){
    try{
      body = JSON.parse(body)
      /*
      if(body.error){
        var nerr = new Error()
        for(var x in body.error){
          nerr[x] = body.error[x]
        }
      }
      */

//console.log('nerr', nerr)
    }catch(e){
//      console.log('request tester error',e)
    }
/*
    if(nerr){
      throw nerr
    }
*/
    throw new Error(body)
  }
}
