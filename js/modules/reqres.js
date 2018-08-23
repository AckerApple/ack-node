"use strict";
exports.__esModule = true;
var req_1 = require("./reqres/req");
var res_1 = require("./reqres/res");
var ack = require('../index.js').ackX;
function reqres(req, res, $scope) {
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
exports.reqres = reqres;
/* res */
//closes request
reqres.prototype.etag = function (string) {
    var isJson = string === null || typeof string != 'string';
    if (isJson) {
        var eTag = ack.etag(JSON.stringify(string));
    }
    else {
        var eTag = ack.etag(string);
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
reqres.prototype.setStatus = function (code, message) {
    this.res.res.statusCode = code;
    this.res.res.statusMessage = message;
    return this;
};
/* params storage string on response object that needs to be sent with closing request */
reqres.prototype.output = function (anything) {
    return this.res.append.apply(this.res, arguments);
};
reqres.prototype.dump = function (output, options) {
    return this.res.dump(output, options);
};
reqres.prototype["throw"] = function (err) {
    if (err && err.constructor == String) { //convert error string to error object with a more correct stack trace
        arguments[0] = new Error(arguments[0]);
        ack.error(arguments[0]).cutFirstTrace();
    }
    return this.res["throw"].apply(this.res, arguments);
};
reqres.prototype.relocate = function (url, statusMessage, statusCode) {
    return this.res.relocate.apply(this.res, arguments);
};
reqres.prototype.sendHTML = function (output, options) {
    return this.res.sendHtml.apply(this.res, arguments);
};
reqres.prototype.sendHtml = reqres.prototype.sendHTML;
reqres.prototype.sendJSON = function (output, options) {
    return this.res.sendJSON.apply(this.res, arguments);
};
reqres.prototype.sendJson = reqres.prototype.sendJSON;
reqres.prototype.abort = function (output, options) {
    return this.res.abort.apply(this.res, arguments);
};
reqres.prototype.send = reqres.prototype.abort;
//has the response been put into HTML mode? default=acceptsHtml()
reqres.prototype.isHtml = function (yN) {
    return this.res.isHtml(yN);
};
/* end: res */
/* req */
reqres.prototype.path = function () {
    return this.req.Path();
};
reqres.prototype.ip = function () {
    return this.req.ip();
};
reqres.prototype.url = function () {
    return this.req.absoluteUrl();
};
reqres.prototype.acceptsHtml = function () {
    return this.req.acceptsHtml();
};
reqres.prototype.getHostName = function () {
    return this.req.getHostName();
};
reqres.prototype.input = function (name) {
    var module = this.req.input().combined();
    return name ? module.get(name) : module;
};
/* end: req */
function method(req, res) {
    return new reqres(req, res);
}
exports.method = method;
