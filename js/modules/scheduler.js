"use strict";
exports.__esModule = true;
var schedule = require("node-schedule");
var index_js_1 = require("../index.js");
var ack_path_1 = require("ack-path");
var file_1 = require("ack-path/js/file");
var ackTask = /** @class */ (function () {
    function ackTask($scope) {
        this.data = $scope || {};
        this.data.log = this.data.log == null ? true : this.data.log;
    }
    ackTask.prototype.getLogFilePath = function () {
        if (this.data.logFilePath)
            return this.data.logFilePath;
        this.data.logFilePath = ack_path_1.method(__dirname).join('logs', 'ackTaskLog.txt').path;
        return this.data.logFilePath;
    };
    ackTask.prototype.getLogFileFolder = function () {
        return ack_path_1.method(this.getLogFilePath());
    };
    ackTask.prototype.getLogFile = function () {
        return file_1.method(this.getLogFilePath());
        //return ackPath(this.getLogFilePath()).file()
    };
    ackTask.prototype.getRequirePromiseByPath = function (path) {
        var _this = this;
        var promise = new Promise(function (res, rej) {
            var exec = require('child_process').exec;
            var cmdProc = function (error, stdout, stderr) {
                if (error) {
                    error.name = 'node-cmd';
                    return rej(error);
                }
                res(stdout);
            };
            exec('node ' + path, cmdProc);
        });
        if (this.data.log) {
            var rr_1;
            promise = promise.then(function (r) {
                var msg = '---path-run@' + _this.getLogFile().path + '@' + new Date() + '\n'; //\r
                rr_1 = r;
                return _this.logResult(msg + r);
            })
                .then(function () { return rr_1; });
        }
        return promise;
    };
    ackTask.prototype.deleteLogPath = function () {
        var LogFile = this.getLogFile();
        var LogPath = LogFile.Path();
        return LogPath["delete"]();
    };
    ackTask.prototype.logResult = function (result) {
        var LogFile = this.getLogFile();
        return LogFile.paramDir()
            .then(function () { return LogFile.append(result); });
    };
    ackTask.prototype.pathEveryMil = function (path, ms, each) {
        var _this = this;
        var inter, index = 0;
        var schedule = {
            cancel: function () {
                clearInterval(inter);
            }
        };
        var will = function () {
            var p = _this.getRequirePromiseByPath(path);
            if (each) {
                each.call(_this, p, schedule, index);
            }
            ++index;
        };
        inter = setInterval(will, ms);
        return schedule; //return the will so after firing actions can run
    };
    ackTask.prototype.pathOnDate = function (path, date) {
        var a = Number(date) - Number(new Date());
        if (a <= 0) { //already expired
            return this.getRequirePromiseByPath(path);
        }
        return index_js_1.ackX.promise().delay(a).set(path).then(this.getRequirePromiseByPath, this);
    };
    //hour = hour of day (military time)
    ackTask.prototype.pathAtTimeOnWeekDays = function (path, hour, minute, each, success, fail) {
        var $this = this, index = 0;
        var will = function () {
            var p = index_js_1.ackX.promise().set(path).then($this.getRequirePromiseByPath, $this); //create a promise that can be repeatedily fired
            if (success) {
                p = p.then(success);
            }
            if (fail) {
                p = p["catch"](fail);
            }
            if (each) {
                each.call($this, p, $sched, index);
            }
            ++index;
        };
        var rule = new schedule.RecurrenceRule();
        rule.dayOfWeek = [new schedule.Range(1, 5)];
        rule.hour = hour || 0;
        rule.minute = minute || 0;
        var $sched = schedule.scheduleJob(rule, will); //the will is repeated once per weekday at the set time
        return this; //return the will so after firing actions can run
    };
    return ackTask;
}());
exports.ackTask = ackTask;
function method($scope) {
    return new ackTask($scope);
}
exports.method = method;
//module.exports.Class = ackTask
