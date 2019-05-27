const schedule = require("node-schedule")
import { ackX } from "../index.js"
import { method as ackPath } from "ack-path"
import { method as file } from "ack-path/js/file"

export class ackTask{
	data:any

	constructor($scope){
		this.data = $scope || {}
		this.data.log = this.data.log==null?true:this.data.log
	}

	getLogFilePath(){
		if(this.data.logFilePath)
			return this.data.logFilePath

		this.data.logFilePath = ackPath(__dirname).join('logs','ackTaskLog.txt').path
		return this.data.logFilePath
	}

	getLogFileFolder(){
		return ackPath(this.getLogFilePath())
	}

	getLogFile(){
		return file(this.getLogFilePath())
		//return ackPath(this.getLogFilePath()).file()
	}

	getRequirePromiseByPath(path){
		let promise:Promise<any> = 
		new Promise((res,rej)=>{
			var	exec = require('child_process').exec
			var cmdProc = function(error, stdout, stderr){
					if(error){
						error.name='node-cmd'
						return rej(error)
					}
					res(stdout)
				}

			exec('node '+path, cmdProc)			
		})

		if(this.data.log){
			let rr
			promise = promise.then(r=>{
				var msg = '---path-run@'+this.getLogFile().path+'@'+new Date()+'\n'//\r
				rr = r
				return this.logResult(msg+r)
			})
			.then(()=>rr)
		}

		return promise
	}

	deleteLogPath(){
		var LogFile = this.getLogFile()
		var LogPath = LogFile.Path()
		return LogPath.delete()
	}

	logResult( result:string ){
		var LogFile = this.getLogFile();
		return LogFile.paramDir()
		.then( ()=>LogFile.append(result) )
	}

	pathEveryMil(path, ms, each){
		var inter, index=0
		var schedule = {
			cancel: function(){
				clearInterval(inter)
			}
		}

		var will = ()=>{
			const p:Promise<any> = this.getRequirePromiseByPath(path)

			if(each){
				each.call(this, p, schedule, index)
			}
			++index
		}

		inter = setInterval(will, ms)

		return schedule//return the will so after firing actions can run
	}

	pathOnDate(path, date){
		var a = Number(date)-Number(new Date())
		if(a<=0){//already expired
			return this.getRequirePromiseByPath(path)
		}
		return ackX.promise().delay(a).set(path).then(this.getRequirePromiseByPath,this)
	}

	//hour = hour of day (military time)
	pathAtTimeOnWeekDays(path, hour, minute, each, success, fail){
		var $this = this, index=0
		var will = function(){
			var p = ackX.promise().set(path).then($this.getRequirePromiseByPath, $this)//create a promise that can be repeatedily fired

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
}

export function method($scope){
	return new ackTask($scope)
}
//module.exports.Class = ackTask