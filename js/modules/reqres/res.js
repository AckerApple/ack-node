"use strict";
exports.__esModule = true;
var ack = require('../../index.js').ackX, reqrtn = require('./req').reqrtn, cookies = require('cookies'), etag = require('etag'), fs = require('fs'), isProductionMode = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() == 'production';
//inbound request response processor
//returns function that appends output that also has a tun of helper methods
function reqres(res, req) {
    if (req && req._headers) {
        throw new Error('Received response object where request object was expected');
    }
    this.res = res;
    this.req = req;
    if (res) {
        if (res.$ && res.$.data) {
            this.data = res.$.data;
        }
        else {
            this.data = { error: null };
            if (!res.$) {
                res.$ = this;
            }
        }
    }
}
exports.reqres = reqres;
reqres.prototype.relocate = function (url, statusMessage, statusCode) {
    statusCode = statusCode || 301;
    this.res.statusCode = statusCode;
    this.res.statusMessage = statusMessage;
    this.res.setHeader('Location', url);
    this.close();
    return this;
};
//ops (only applies when output is typeof object. See function dump())
reqres.prototype.append = function (output, ops) {
    var isBuffer = Buffer.isBuffer(output);
    if (!isBuffer) {
        switch (typeof (output)) {
            case 'object':
                ops = ops || {};
                ops.levels = ops.levels || 3;
                ops.collapse = ops.collapse || ['function'];
                output = ack(output).dump(ops);
                //output = ack(output).dump('html',ops)
                break;
        }
    }
    //this.data.output += output;
    this.res.$.data.output = this.res.$.data.output ? this.res.$.data.output + output : output;
    return this;
};
reqres.prototype.output = reqres.prototype.append;
//ops:format,label,expand,collapse,show,hide,hideTypes,top,levels,sortKeys,syntaxHighlight,dumpFunctionName
reqres.prototype.dump = function (v, ops) {
    ops = ops || {};
    if (!ops.format && this.isHtml()) {
        ops.format = 'html';
    }
    return this.append(v, ops);
};
function isResHeaderSent(res) {
    return res.closed || res._headerSent;
}
reqres.prototype.isHeaderSent = function () {
    return isResHeaderSent(this.res);
};
//closing request handler
/*
reqres.prototype.send = function(output){
  return xreqhan(this.res, this.req, output)
}*/
/** if request is open, optional content can be appended to output and then the request is closed */
reqres.prototype.close = function (o, ops) {
    if (!this.isHeaderSent()) {
        if (o)
            this.append(o, ops);
        var output = getResOutput(this.res);
        xreqhan(this.res, this.req, output);
    }
    return this;
};
//has the response been put into HTML mode? default=acceptsHtml()
reqres.prototype.isHtml = function (yN) {
    if (this.res.$.data.isHtml === false || this.res.$.data.isHtml === true) {
        return this.res.$.data.isHtml;
    }
    var rr = new reqrtn(this.req, this.res);
    return rr.acceptsHtml();
};
reqres.prototype.prepend = function (s) {
    this.res.$.data.output = s + this.res.$.data.output;
    return this;
};
/** request is closed with optional output append to request */
reqres.prototype.abort = function (output) {
    //if(o)this.append(o,ops)
    output = output || getResOutput(this.res);
    xreqhan(this.res, this.req, output);
    return this;
};
reqres.prototype.send = reqres.prototype.abort; //two names same game
reqres.prototype.sendHTML = function (html) {
    this.res.setHeader('content-type', 'text/html');
    this.send(html);
};
reqres.prototype.sendHtml = reqres.prototype.sendHTML;
reqres.prototype.sendJSON = function (data, spaces) {
    try {
        data = JSON.stringify(data, null, spaces);
    }
    catch (e) { }
    this.res.setHeader('content-type', 'application/json');
    this.send(data);
};
reqres.prototype.sendJson = reqres.prototype.sendJson;
reqres.prototype.sendFileByPath = function (path, mimeType) {
    var jFile = ack.file(path);
    return jFile.stat().bind(this)
        .then(function (stats) {
        if (!mimeType) {
            mimeType = jFile.getMimeType();
        }
        this.res.statusCode = 200;
        this.res.setHeader('Content-Length', stats.size);
        this.res.setHeader('Content-Type', mimeType);
        this.res.setHeader('Content-Disposition', 'filename="' + jFile.getName() + '"');
        return path;
    })
        .then(fs.createReadStream)
        .then(function (rs) {
        rs.pipe(this.res);
    });
};
/** cookies().set(name, [value], [{maxAge,expires,path,domain,secure,secureProxy,httpOnly,signed,overwrite}]) */
reqres.prototype.cookies = function () {
    if (this.Cookies)
        return this.Cookies;
    this.Cookies = new cookies(this.req, this.res);
    return this.Cookies;
};
/** ! DEPRECATED ! */
reqres.prototype.ci = function () {
    if (this.ClientInput)
        return this.ClientInput;
    this.ClientInput = new ClientInput(this.res, this.req);
    return this.ClientInput;
};
//creates new error object to make an in-line stack trace. Adds error object to output
reqres.prototype["throw"] = function (err) {
    var dumper;
    /* //removed 2/2/2016
      if(typeof(err)=='object' && err.stack){// && e.constructor.name=='Error' || e.constructor.name=='SyntaxError'
        dumper = {
          stack      : err.stack.split(' at '),//back to string
          err        : err,
          stackTrace : err.stack,
          message    : err.message
        }
        //for(x in e)d[x] = e[x]
      }else
    */
    if (err && err.constructor == String) {
        dumper = new Error(err);
        err = dumper;
        ack.error(dumper).cutFirstTrace();
    }
    else {
        dumper = err;
    }
    if (this.catcherArray) {
        this.catcherArray.forEach(function (catcher, i) {
            catcher(err);
        });
    }
    reqResThrow(this.req, this.res, dumper);
    return this;
};
reqres.prototype["catch"] = function (method) {
    this.catcherArray = this.catcherArray || [];
    this.catcherArray.push(method);
    return this;
};
//adds error object to output
reqres.prototype.error = function (e) {
    var x, sa, d = {};
    for (x in e)
        d[x] = e[x];
    d.stack = e.stack; //back to string
    this.res.$.data.error = d;
    return this;
};
/** looks at generated output to create an etag header. If client ETag header "If-None-Match" present and it matches generated etag, output is cleared and 304 cache indicator is fired */
reqres.prototype.etag = function (options) {
    var options = options || {};
    if (options.weak == null) {
        options.weak = true;
    }
    var noMatchHead = ack.reqres(this.req, this.res).input.header('If-None-Match');
    var output = getResOutput(this.res);
    var eTagVal = etag(output);
    this.res.setHeader('ETag', eTagVal);
    if (noMatchHead == eTagVal) {
        this.res.$.data.output = '';
        this.res.statusCode = 304;
        this.res.statusMessage = 'Not Modified';
    }
    return this;
};
//error handler
function geterrhan() {
    return function (err, req, res, next) {
        try {
            new reqres(res, req)["throw"](err);
        }
        catch (e) {
            console.trace('!!!jE THROW PROCESSING FAILED!!!', e.stack);
            throw (err);
        }
        //next()
    };
}
exports.geterrhan = geterrhan;
/*
reqres.getxreqhan = function(){
  return function(req,res,next){
    if(!isResHeaderSent(res)){
      xreqhan(res, req);
    }
  }
}
*/
/* !!! DEPRECATED !!! */
var ClientInput = function ClientInput(res, req) {
    this.res = res;
    this.req = req;
};
/** cookies().set(name, [value], [{maxAge,expires,path,domain,secure,secureProxy,httpOnly,signed,overwrite}]) */
ClientInput.prototype.cookies = function () {
    if (this.Cookies)
        return this.Cookies;
    this.Cookies = new cookies(this.req, this.res);
    return this.Cookies;
};
/* END */
/** only returns output data collected by reqres */
function getResOutput(res) {
    if (res.$ && res.$.data && res.$.data.output) {
        return res.$.data.output;
    }
}
/** close request handler */
function xreqhan(res, req, output) {
    if (isResHeaderSent(res)) {
        return console.error('request already closed', new Error().stack);
    }
    output = output || '';
    var isBinary = output && Buffer.isBuffer(output);
    if (isBinary) {
        res.end(output, 'binary');
    }
    else if (res.send) { //Express adds send
        res.send(output);
    }
    else if (res.end) { //base way to end request
        output = reqResOutputToString(req, res, output);
        res.end(output);
    }
    resMarkClosed(res); //add indicators that show response has been closed
}
function reqResOutputToString(req, res, output) {
    if (res.getHeader('content-type') == null) {
        if (output === null || typeof output == 'object') {
            output = JSON.stringify(output);
            res.setHeader('content-type', 'application/json');
        }
        else if (ack.reqres(req, res).isHtml()) {
            res.setHeader('content-type', 'text/html');
        }
        else {
            res.setHeader('content-type', 'text/plain');
        }
    }
    if (res.getHeader('content-length') == null && output && output.length) {
        res.setHeader('content-length', output.length);
    }
    else {
        res.statusCode = res.statusCode || 204;
    }
    return output;
}
function getErrorMsg(err) {
    return err.message || err.code;
}
/** Handles sending errors back to client including approperiate error details.
  - response status always 500 unless (err.status || err.statusCode)
*/
var reqResThrow = function (req, res, err) {
    if (isResHeaderSent(res)) { //request has already been closed
        //console.log('cannot throw error on an already closed request')
        return;
    }
    if (typeof (err.stack) == 'string') {
        err.stack = err.stack.split(' at '); //stack string to array
    }
    var isHtml = new reqres(res, req).isHtml();
    if (isHtml) {
        ack.router().htmlCloseError({ debug: isProductionMode })(err, req, res);
    }
    else {
        ack.router().jsonCloseError({ debug: isProductionMode })(err, req, res);
    }
    resMarkClosed(res);
};
var resMarkClosed = function (res) {
    res.closed = 1;
};
