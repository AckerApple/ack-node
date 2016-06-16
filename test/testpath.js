var mocha = require('mocha')

mocha = new mocha

mocha.addFile('Cases/node/Path.js')

mocha.run(function(failures){
	process.on('exit', function(){
    	process.exit(failures);
	})
})