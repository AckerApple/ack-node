"use strict";
var schedule = require('node-schedule'),
	ack = require('../index.js')

var ackTask = function ackTask($scope){
	this.data = $scope || {}
	this.data.log = this.data.log==null?true:this.data.log
	return this
}

//	this.data.logFilePath = this.data.logFilePath || ack.path(__dirname).join('ackTaskLog.txt')

ackTask.prototype.getLogFilePath = function(){
	if(this.data.logFilePath)
		return this.data.logFilePath

	this.data.logFilePath = ack.path(__dirname).join('logs','ackTaskLog.txt').path
	return this.data.logFilePath
}

ackTask.prototype.getLogFile = function(){
	return ack.file(this.getLogFilePath())
}

ackTask.prototype.getRequirePromiseByPath = function(path){
	var promise = ack.promise().callback(function(callback){
		var	exec = require('child_process').exec
			,cmdProc = function(error, stdout, stderr){
				if(error){
					error.name='node-cmd'
					return callback(error)
				}
				callback(null,stdout)
			}

		exec('node '+path, cmdProc)
	})

	if(this.data.log){
		promise = promise.past(function(r){
			var msg = '---path-run@'+this.getLogFile().path+'@'+new Date()+'\r\n'
			return this.logResult(msg+r)
		},this)
	}

	return promise
}

ackTask.prototype.deleteLogPath = function(){
	var LogFile = this.getLogFile()
	var LogPath = LogFile.Path()
	return LogPath.delete()
}

ackTask.prototype.logResult = function(result){
	var LogFile = this.getLogFile()
	return LogFile.paramDir().set(result).then(LogFile.append,LogFile)
}

ackTask.prototype.pathEveryMil = function(path, ms, each){
	var inter, index=0
	var schedule = {
		cancel: function(){
			clearInterval(inter)
		}
	}

	var $this = this
	var will = function(){

		var p = ack.promise()
		.set(path).bind($this)
		.then($this.getRequirePromiseByPath)//create a promise that can be repeatedily fired
		.then(function(){
			var args = Array.prototype.slice.call(arguments)
			args.push(schedule)
			return args
		})
		.spread()

		if(each){
			each.call($this, p, schedule, index)
		}
		++index
	}

	inter = setInterval(will, ms)

	return this//return the will so after firing actions can run
}

ackTask.prototype.pathOnDate = function(path, date){
	var a = Number(date)-Number(new Date())
	if(a<=0){//already expired
		return this.getRequirePromiseByPath(path)
	}
	return ack.promise().delay(a).set(path).then(this.getRequirePromiseByPath,this)
}

//hour = hour of day (military time)
ackTask.prototype.pathAtTimeOnWeekDays = function(path, hour, minute, each, success, fail){
	var $this = this, index=0
	var will = function(){
		var p = ack.promise().set(path).then($this.getRequirePromiseByPath, $this)//create a promise that can be repeatedily fired

		if(success){
			p = p.then(success)
		}

		if(fail){
			p = p.catch(fail)
		}

		if(each){
			each.call($this, p, $sched, index)
		}
		++index
	}

	var rule = new schedule.RecurrenceRule()
	rule.dayOfWeek = [new schedule.Range(1, 5)]
	rule.hour = hour || 0
	rule.minute = minute || 0

	var $sched = schedule.scheduleJob(rule, will)//the will is repeated once per weekday at the set time

	return this//return the will so after firing actions can run
}

module.exports = function($scope){
	return new ackTask($scope)
}
module.exports.Class = ackTask