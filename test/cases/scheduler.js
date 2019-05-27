var ack = require('../../index.js').ackX
var ackTask = ack.scheduler()
var path = require('path')

describe('ackTask',function(){
	this.timeout(4000)

	let mySchedule

	it.skip('#pathEveryMil',function(done){
		var fp = path.join(__dirname,'../','assets','modules','logNumber1.js')
		var fileResultReader = function(result){
			result = result.trim()
			var lineArray = result.split(new RegExp('\r\n|\r|\n', 'gi'))
			if(lineArray.length!=10){
				if( mySchedule ){
					mySchedule.cancel()
				}
				throw new Error(ackTask.data.logFilePath+' log did not contain 10 lines. Got '+lineArray.length+' : '+result)
			}
		}

		var repeater = function(promise, schedule, index){//intended to run after every run
			mySchedule = schedule
			return promise
			.then((...args)=>{
				const result = args[0]

				if(result!=1){
					return done(new Error('logNumber1.js did not return number 1. Got '+result))
				}
				if(index==5){
					schedule.cancel()
					return this.getLogFile().readAsString()
					.then(fileResultReader)
					.then(done).catch(done)
				}
			})
			.catch(done)
		}

		ackTask.getLogFile().delete()
		.then(function(){
			const scheduler = ackTask.pathEveryMil(fp, 60, repeater)
			
			//safe gaurd
			setTimeout(()=>scheduler.cancel(), 1000)
			
			return scheduler
		})
		.catch(done)
	})

	describe('#pathOnDate',function(){
		it('promises',function(done){
			var fp = path.join(__dirname,'../','assets','modules','logNumber1.js')
			var onD = ack.date().now()
			onD = onD.addMilliseconds(100).date

			var Task = ackTask.pathOnDate(fp, onD)
			Task.then(function(result){
				if(result!=1)throw new Error('expected 1. Got type '+typeof(result));
			})
			.delay(200)
			.past(ackTask.deleteLogPath,ackTask)
			.then(done).catch(done)
		})

		it('catches-throw',function(done){
			var fp = path.join(__dirname,'../','assets','modules','hasErrorThrown.js')
			var onD = ack.date(new Date()).addMilliseconds(100).date

			ackTask.pathOnDate(fp,onD)
			.then(function(result){
				if(result!=1)throw new Error('expected 1');
			})
			.catch('node-cmd',function(){
				done()
			})
			.catch(function(e){
				done(new Error('wrong error handler called'))
			})
		})

		it('catches-syntax',function(done){
			var fp = path.join(__dirname,'../','assets/hasErrorSyntax.js')
			var onD = ack.date(new Date()).addMilliseconds(100).date
			ackTask.pathOnDate(fp,onD)
			.then(function(result){
				if(result!=1){
					throw new Error('expected 1');
				}
			})
			.catch('node-cmd',function(){
				done()
			})
			.catch(done)
		})
	})

})