"use strict";
exports.__esModule = true;
var req_1 = require("./reqres/req");
var res_1 = require("./reqres/res");
var index_1 = require("../index");
function Class(req, res, $scope) {
    if ($scope === void 0) { $scope = {}; }
    this.data = $scope;
    var iReq = new req_1.reqrtn(req, res);
    var iRes = new res_1.reqres(res, req);
    this.req = iReq;
    this.res = iRes;
    this.input.header = function (name) {
        var module = iReq.input().headers();
        return name ? module.get(name) : module;
    };
    this.input.headers = this.input.header; //multi-ref
    this.input.cookie = function (name) {
        var module = iReq.input().cookies();
        return name ? module.get(name) : module;
    };
    this.input.cookies = this.input.cookie; //multi-ref
    this.input.url = function (name) {
        var module = iReq.input().url();
        return name ? module.get(name) : module;
    };
    this.input.multipart = function (name) {
        var module = iReq.input().multipart();
        return name ? module.get(name) : module;
    };
    this.input.form = function (name) {
        var module = iReq.input().form();
        return name ? module.get(name) : module;
    };
}
exports.Class = Class;
/* res */
//closes request
Class.prototype.etag = function (string) {
    var isJson = string === null || typeof string != 'string';
    if (isJson) {
        var eTag = index_1.ackX.etag(JSON.stringify(string));
    }
    else {
        var eTag = index_1.ackX.etag(string);
    }
    var res = this.res.res;
    var noMatchHead = this.input.header('If-None-Match');
    if (noMatchHead == eTag) {
        res.statusCode = 304;
        res.statusMessage = 'Not Modified';
        res.end();
    }
    else {
        res.setHeader('ETag', eTag);
        this.res.abort(string);
    }
};
Class.prototype.setStatus = function (code, message) {
    this.res.res.statusCode = code;
    this.res.res.statusMessage = message;
    return this;
};
/* params storage string on response object that needs to be sent with closing request */
Class.prototype.output = function (anything) {
    return this.res.append.apply(this.res, arguments);
};
Class.prototype.dump = function (output, options) {
    return this.res.dump(output, options);
};
Class.prototype["throw"] = function (err) {
    if (err && err.constructor == String) { //convert error string to error object with a more correct stack trace
        arguments[0] = new Error(arguments[0]);
        index_1.ackX.error(arguments[0]).cutFirstTrace();
    }
    return this.res["throw"].apply(this.res, arguments);
};
Class.prototype.relocate = function (url, statusMessage, statusCode) {
    return this.res.relocate.apply(this.res, arguments);
};
Class.prototype.sendHTML = function (output, options) {
    return this.res.sendHtml.apply(this.res, arguments);
};
Class.prototype.sendHtml = Class.prototype.sendHTML;
Class.prototype.sendJSON = function (output, options) {
    return this.res.sendJSON.apply(this.res, arguments);
};
Class.prototype.sendJson = Class.prototype.sendJSON;
Class.prototype.abort = function (output, options) {
    return this.res.abort.apply(this.res, arguments);
};
Class.prototype.send = Class.prototype.abort;
//has the response been put into HTML mode? default=acceptsHtml()
Class.prototype.isHtml = function (yN) {
    return this.res.isHtml(yN);
};
/* end: res */
/* req */
Class.prototype.path = function () {
    return this.req.Path();
};
Class.prototype.ip = function () {
    return this.req.ip();
};
Class.prototype.url = function () {
    return this.req.absoluteUrl();
};
Class.prototype.acceptsHtml = function () {
    return this.req.acceptsHtml();
};
Class.prototype.getHostName = function () {
    return this.req.getHostName();
};
Class.prototype.input = function (name) {
    var module = this.req.input().combined();
    return name ? module.get(name) : module;
};
/* end: req */
function method(req, res) {
    return new Class(req, res);
}
exports.method = method;
function reqres(req, res) {
    return new Class(req, res);
}
exports.reqres = reqres;
