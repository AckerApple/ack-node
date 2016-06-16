"use strict";
var readDir = require('readdir')//consider replacing with "readdirp"
	,fs = require('fs')
	,path = require('path')
	,ack = require('../index.js')
	,mkdirp = require('mkdirp')//recursive create directories
	,rimraf = require('rimraf')//recursive delete directories
//,jC = require('jC')

var Path = function(path){
	this.path = path
	this.new = new NewPath(this)
	this.string = new PathString(this)
	return this
}

/** performs .join but original object remains untouched */
Path.prototype.Join = function(pathTo){
	pathTo = pathTo ? path.join(this.path,pathTo) : this.path
	return new Path(pathTo)
}
Path.prototype.Path = Path.prototype.Path

Path.prototype.file = function(name){
	var p = name ? path.join(this.path,name) : this.path
	return ack.file(p)
}
Path.prototype.File = Path.prototype.file

//access blocking code based methods
Path.prototype.sync = function(){
	return new PathSync(this.path)
}

Path.prototype.getName = function(){
	var p = this.path.replace(/\\|\/$/g,'')//remove last slash
	return p.split(/\\|\//).pop()//return last
}

//!Stand alone function, not part of Path Class
Path.noLastSlash = function(path){
   	return path.replace(/(\/|\\)$/,'')
}

Path.prototype.noLastSlash = function(){
	this.path = this.string.noLastSlash()
	return this
}

Path.prototype.noFirstSlash = function(){
	this.path = this.string.noFirstSlash()
	return this
}

Path.prototype.up = function(){
	return this.join('../')
}

Path.prototype.join = function(){
	this.path = this.string.join.apply(this.string,arguments)
	return this
}

/** removes the file name from path */
Path.prototype.removeFile = function(){
	this.path = this.string.removeFile();
	return this
}
Path.prototype.removeFileName = Path.prototype.removeFile

Path.prototype.removeExt = function(){
	this.path = this.string.removeExt()
	return this
}

Path.prototype.ext = function(ext){
	this.path = this.string.ext(ext)
	return this
}

Path.prototype.upEach = function(eachMethod){
	return this.upNext(function(Path,next){
    	var r = eachMethod(Path)
    	if(r==null || r)next()
	})
}

//makes this object go up a path ../
Path.prototype.upNext = function(method){
	if(this.getDepth()<=1){
		return this
	}

	var $this = this
    method.call(this,this,function(){
		$this.new.join('../').upNext(method)
	})

	return this
}

Path.prototype.getDepth = function(){
	var tPath = this.path.replace(/^(\.+)?((\/|\\)+)/,'')
	if(!tPath.length)return 0
	return tPath.split(/\/|\\/).length
}

Path.prototype.isFile = function(){
	return this.path ? this.path.search(/(.+(\/|\\))?[^\/]+\.[^/\.]+$/) > -1 : false
}

Path.prototype.exists = function(cbOrPath,cb){
	var isArg1String = typeof(cbOrPath)=='string'
		,callb = isArg1String ? cb : cbOrPath
		,p = isArg1String ? this.string.join(cbOrPath) : this.path
		,t=this

	return ack.promise().set(p)
	.next(fs.exists)//.next(fs.stat).set(true).catch(function(){return false})
}

Path.prototype.ifExists = function(pathOrCb,cbOrElse,els){
	var isSubPath = typeof(pathOrCb)=='string'
		,p = isSubPath ? pathOrCb : null
		,emp = function(){}
		,cb = isSubPath ? cbOrElse : pathOrCb

	els = isSubPath ? els||emp : cbOrElse||emp

	this.exists().if(true,cb,this).if(false,els,this)

	return this
}

Path.prototype.require = function(file){
	var filePath = file? path.join(this.path,file) : this.path
	return ack.promise().then(function(){
		return require(filePath)
	})
}

//recursively creates paths
Path.prototype.paramDir = function(subPath,options){
	var tarPath = subPath ? path.join(this.path,subPath) : this.path

	return ack.promise()
	.next(function(next){
		mkdirp(tarPath,options,function(err){
			if(err)return next.throw(err)
			next()
		})
	})
	.then(function(){
		return this
	},this)
}

Path.prototype.param = function(){
	if(this.isFile())
		throw 'not yet built';

	return this.paramDir.apply(this,arguments)
}

Path.prototype.delete = function(){
	if(this.isFile()){//file delete only
		return ack.promise()
		.set(this.path)
		.next(function(path,next){
			fs.unlink(path,next)
		})
	}

	var promise = ack.promise()
	.next(function(next){
		rimraf(this.path,function(err){
			if(err)return next.throw(err)
			next()
		})
	},this)

	return promise
}


Path.prototype.getSubDirByName = function(subDirName){
	return this.new.join(subDirName)
}

Path.prototype.getSubDirArray = function(){
	var $this = this
	return ack.promise()
	.next(function(next){
		$this.getSubDirNameArray(function(sdnArray){
			sdnArray.forEach(function(v,i){
				var SubDir = $this.getSubDirByName(v)
				sdnArray[i] = SubDir
			})
			next(sdnArray)
		})

	})
}

Path.prototype.getSubDirNameArray = function(callback){
	readDir.read(this.path, ['*/'], readDir.INCLUDE_DIRECTORIES + readDir.NON_RECURSIVE, function(err,a){
		if(err){
			console.error(err)
		}
		callback(a)
	})
	return this
}

Path.prototype.eachSubDir = function(callback, last){
	var t = this
	this.getSubDirArray().then(function(array){
		array.forEach(function(v,i){
			return callback.call(t,v,i)
		})
		if(last)last.call(this,array)
	})
	return this
}

Path.prototype.nextSubDir = function(each){
	var $this=this
	return this.getSubDirArray().then(function(array){
		var promise = ack.promise()
		array.forEach(function(v,i){
			promise.next(function(next){
				each.call($this,v,i,next)
			})
		})
		return promise
	})
}

Path.prototype.fileSearchUp = function(fileName){
	var nPath = this.path
	if(fileName){
		nPath = path.join(nPath, fileName)
	}
	return new SearchUpPath(new Path(nPath))
}

/**
	returns promise of value array containing result of all required files (2nd promise value is array of results and paths)
	-error thrown if just one require fails
*/
Path.prototype.recurRequirePath = function(options){
	options = options ? options: {}
	options.filter = options.filter ? options.filter : []
	options.filter.push('**.js')//current directory/subdirectory with .js extension
	var resultArray = []
	var requirePathArray = []

	var processor = function(Path, i){
		var result = require(Path.path)
		resultArray.push( result )
		requirePathArray.push( {result:result, Path:Path, path:Path.path} )
		/*
		try{
			var mod = require(Path.path)
		}catch(e){
			eachCall(e,null,Path,i);return
		}
		return eachCall(null, mod, Path, i)
		*/
	}

	return this.recurFilePath(processor, options).set(resultArray, requirePathArray)
}

/**
	!deprecated
	each js file will be found and eachCall(result) run.
*/
Path.prototype.recurRequireFilePath = function(eachCall, options, after){
	ack.deprecated('recurRequireFilePath is a deprecated method in Path. User recurRequirePath')

	options = options ? options: {}
	options.filter = options.filter ? options.filter : []
	options.filter.push('**.js')//current directory/subdirectory with .js extension

	var processor = function(Path, i){
		try{
			var mod = require(Path.path)
		}catch(e){
			eachCall(e,null,Path,i);return
		}
		return eachCall(null, mod, Path, i)
	}

	return this.recurFilePath(processor, options, after)
}

/** see eachPath function */
Path.prototype.recurFilePath = function(eachCall, options, after){
	options = options ? options : {}
	options.NON_RECURSIVE=false
	return this.eachFilePath(eachCall, options, after)
}

/** see eachPath function */
Path.prototype.eachFilePath = function(eachCall, options, after){
	options = options ? options : {}
	options.INCLUDE_DIRECTORIES=false
	return this.eachPath(eachCall, options, after)
}


/** see Path.prototype.each function
	@eachCall:function(Object:Path, Number:index)
*/
Path.prototype.eachPath = function(eachCall, options, after){
	var repeater = function(v,i){
		return eachCall(this.new.join(v), i)
	}
	return this.each(repeater, options, after)
}

/** file/path looper.

	- Based on options, you can recursively read directories and/or files. returns promise
	- Runs using npm package readdir. See npm readdir for more usage instructions.

	@eachCall:function(String:path, Number:index)
	@options: (afterFunction ||
		{
			NON_RECURSIVE:true,
			INCLUDE_DIRECTORIES:true,
			after:function,
			filter:['** / **.js','** / **.jade']//!remove spaces from example!
		}
	)

*/
Path.prototype.each = function(eachCall, options, after){
	var opsNum = Path.castReadOps(options)
		,filter = Path.getFilterByReadOps(options)

	if(!after){
		if(typeof(options)=='function'){
			after = options
		}else{
			after = options && options.after ? options.after : null
		}
	}

	var looping
	var promise = ack.promise()
	.set(this.path, filter, opsNum)
	.bind(readDir)
	.callback(readDir.read)
	.bind(this)
	.map(function(v,i){
		if(looping!==false){
			looping = eachCall.call(this,v,i)
		}
	})

	if(after){
		promise = promise.past(after)
	}

	return promise
}

Path.prototype.eachSubDirName = function(callback){
	this.getSubDirNameArray(function(array){
		array.forEach(function(v,i){
			callback(v,i)
		})
	})
	return this
}


//NON PROTOTYPE METHODS
Path.getFilterByReadOps = function(options){
	if(options && options.filter)return options.filter
	return null
}


Path.castReadOps = function(options){
	options = options ? options : {}
	var opResult = 0

	if(options.NON_RECURSIVE==null)
		opResult += readDir.NON_RECURSIVE

	if(options.INCLUDE_DIRECTORIES==null)
		opResult += readDir.INCLUDE_DIRECTORIES

	return opResult
}











//Class dedicated to blocking methods
var PathSync = function PathSync(path){
	this.path = path
	return this
}

PathSync.prototype.exists = function(pathOf){
	pathOf = pathOf ? path.join(this.path,pathOf) : this.path
/*
	try{
		fs.statSync(filePath);
		return true;
	}catch(err){
		return false;
		//if(err.code == 'ENOENT') return false;
	}
*/
	return fs.existsSync(pathOf)
}

PathSync.prototype.getSubDirNameArray = function(callback){
	return readDir.readSync(this.path, ['*/'], readDir.INCLUDE_DIRECTORIES + READDIR.NON_RECURSIVE)
}













var PathString = function PathString(Path){
	this.Path = Path
	return this
}

PathString.prototype.removeFile = function(){
	return this.Path.path.replace(/[^/\\]+\.[^.\/]+$/,'')
}

PathString.prototype.removeExt = function(){
	return this.Path.path.replace(/\.[^.\/]+$/,'')
}

PathString.prototype.ext = function(ext){
	ext = ext.replace(/^\./,'')
	var newPath = this.removeExt()
	newPath = Path.noLastSlash(newPath) + '.' + ext
	return newPath
}

PathString.prototype.noLastSlash = function(){
	return Path.noLastSlash(this.Path.path)
}

PathString.prototype.noFirstSlash = function(){
	return this.Path.path.replace(/^(\/|\\)/,'')
}

PathString.prototype.join = function(){
	var args = Array.prototype.slice.call(arguments)
	args.unshift(this.Path.path)
	//all args to string as Nodes path will fail on path.join(somePath,2016)
	for(var i=args.length-1; i >= 0; --i){
		args[i]=String(args[i])
	}
	return path.join.apply(path,args)
}















var NewPath = function NewPath(Path){
	this.Path = Path
	return this
}

NewPath.prototype.noFirstSlash = function(){
	return new Path(this.Path.string.noFirstSlash())
}

NewPath.prototype.noLastSlash = function(){
	return new Path(this.Path.string.noLastSlash())
}

NewPath.prototype.join = function(){
	var args = Array.prototype.slice.call(arguments)
	args.unshift(this.Path.path)
	var p = path.join.apply(path, args)
	return new Path(p)
}

NewPath.prototype.ext = function(ext){
	return new Path(this.Path.string.ext(ext))
}

NewPath.prototype.searchUp = function(){
	return new SearchUpPath(new Path(this.Path.path))
}







function SearchUpPath(Path){
	this.Path = Path
	return this
}
/*
jC(SearchUpPath)({
	 Ext           : {
	 					preset:function(v){
	 						return v.replace(/^(.+)?\./,'')
	 					}
	 				}
	,IndexFileName : {
						preset:function(v){
							if(v.search(/([^\/\\]+)?\.[^.]+$/) > 1){
								this.setExt(v)
							}
							return v.replace(/^(.+)?(\\|\/)/,'').replace(/\.([^.]+)?/,'')//replace(no opening slashes) . replace(any extension)
						}
					}
	,Success       : {setAka:'success'}
	,RollUpWith    : {setAka:'rollUpWith'}
	,Fail          : {setAka:'fail'}
})
*/

SearchUpPath.prototype.setExt = function(ext){
	this.ext = ext.replace(/^(.+)?\./,'');return this;
}

SearchUpPath.prototype.getExt = function(){
	return this.ext
}


SearchUpPath.prototype.setIndexFileName = function(v){
	if(v.search(/([^\/\\]+)?\.[^.]+$/) > 1){
		this.setExt(v)
	}
	this.indexFileName = v.replace(/^(.+)?(\\|\/)/,'').replace(/\.([^.]+)?/,'')//replace(no opening slashes) . replace(any extension)
	return this
}

SearchUpPath.prototype.getIndexFileName = function(v){
	return this.indexFileName
}


SearchUpPath.prototype.setSuccess = function(v){
	this.onSuccess = v;return this;
}
SearchUpPath.prototype.success = SearchUpPath.prototype.setSuccess

SearchUpPath.prototype.getSuccess = function(){
	return this.onSuccess
}


SearchUpPath.prototype.setRollUpWith = function(v){
	this.rollupWith = v;return this;
}
SearchUpPath.prototype.rollUpWith = SearchUpPath.prototype.setRollUpWith

SearchUpPath.prototype.getRollUpWith = function(){
	return this.rollupWith
}


SearchUpPath.prototype.setFail = function(v){
	this.onFail = v;return this;
}
SearchUpPath.prototype.fail = SearchUpPath.prototype.setFail

SearchUpPath.prototype.getFail = function(){
	return this.onFail
}


SearchUpPath.prototype.go = function(){
	var success = this.getSuccess()
		,roll = this.getRollUpWith()
		,Path = this.Path
		,fail = this.getFail()
		,ext = this.getExt()
		,ifn = this.getIndexFileName()+'.'+ext

	var resultStatus = {isFirstFind:true, isIndex:false}

	return ack.promise()
	.callback(function(callback){
		var nextProcessor = function(Path, next){
			var isFile = Path.isFile() || Path.noLastSlash().isFile()
			if(isFile){
				Path.ifExists(function(){
					callback(null, Path.path, resultStatus)
					success(Path.path)//deprecated in favor of promises
				},function(p){
					if(roll){
						roll.up()//rollup path
					}
					next()
				})
			}else{
				//could not be found logic
				var failUp = function(p){
					var isRollLeft = roll==null || roll.getDepth()>=1

					if(roll){
						roll.up()
					}

					if(isRollLeft){
						next()
					}else{
						callback(null, null, resultStatus)//could not be found
						fail()
					}
				}
				var testExt = function(){
					var isRollLeft = roll==null || roll.getDepth()>=1

					if(isRollLeft){
						Path.ext(ext)//maybe what is a directory is a jade file
						if(roll){
							roll.ext(ext)//maybe what is a directory is a jade file
						}

						Path.ifExists(function(){
							callback(null, Path.path, resultStatus)
							success(Path.path)
						},failUp)
					}else{
						callback(null, null, resultStatus)//could not be found
						fail()
					}
				}

				if(ifn){//maybe directory with index file with-in?
					if(roll){
						roll.join(ifn)
					}

					Path.join(ifn).ifExists(function(){
						resultStatus.isIndex = true
						callback(null, Path.path, resultStatus)
						success(Path.path)
					},function(){
						resultStatus.isFirstFind = false//we have to seach elsewhere so it is not the first find

	    				Path.up()//remove index (do not do to relPath.up because relPath.upNext takes care of it)
						if(roll){
							roll.up()//remove index (do not do to relPath.up because relPath.upNext takes care of it)
						}

						if(ext){
							testExt()
						}
					})
				}else if(ext){
					testExt()
				}
			}
		}

		return Path.upNext(nextProcessor)
	})
}





module.exports = function(path){return new Path(path)}