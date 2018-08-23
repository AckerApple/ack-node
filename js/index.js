"use strict";
exports.__esModule = true;
var ack_x_1 = require("ack-x");
var nodedump_1 = require("nodedump");
var path = require("path");
exports.ackX = ack_x_1.ack;
var modulesPath = path.join(__dirname, 'modules');
/* practically direct package access */
exports.ackX["modules"].definePath('crypto', path.join(modulesPath, 'crypto.js'));
//ackX["modules"].definePath('jade', path.join(modulesPath,'jade.js'))
/* end */
exports.ackX["modules"].definePath('ip', path.join(modulesPath, 'ip.js'));
exports.ackX["modules"].definePath('jwt', path.join(modulesPath, 'Jwt.js'));
exports.ackX["modules"].definePath('reqres', path.join(modulesPath, 'reqres.js'));
exports.ackX["modules"].definePath('router', path.join(modulesPath, 'router.js'));
exports.ackX["modules"].definePath('req', path.join(modulesPath, 'req.js'));
exports.ackX["modules"].definePath('file', path.join(modulesPath, 'File.js'));
exports.ackX["modules"].definePath('path', path.join(modulesPath, 'Path.js'));
exports.ackX["modules"].definePath('dsc', path.join(modulesPath, 'dsc', 'dsc.js'));
exports.ackX["modules"].definePath('scheduler', path.join(modulesPath, 'scheduler.js'));
exports.ackX["modules"].definePath('reqres', path.join(modulesPath, 'reqres.js'));
exports.ackX["modules"].definePath('req', path.join(modulesPath, 'req.js'));
/** offers functionality for rendering pug/jade like templates string */
exports.ackX["modules"].definePath('templating', path.join(modulesPath, 'templating.js'));
/** one time quic qay to render file-by-path and returns jade string */
exports.ackX["modules"].define('template', function (filePath, locals) {
    return exports.ackX["templating"](filePath).render(locals);
});
exports.ackX["modules"].definePath('mail', path.join(modulesPath, 'Mail.js'));
var etag = require("etag");
exports.ackX["etag"] = etag;
/**
    @options - {
        label,expand,top,levels
        hideTypes:['Function']//array of strings. String = constructor type name
    }
*/
exports.ackX["prototype"].dump = function (format, options) {
    if (format && format.constructor == Object) {
        options = format;
        format = options.format || 'json';
    }
    format = format ? format : 'json';
    switch (format.toLowerCase()) {
        case 'html': return nodedump_1.dump(this.$var, options);
        default: return JSON.stringify(this.$var);
    }
};
/** detects process.env.NODE_ENV */
exports.ackX["isProductionMode"] = function () {
    return (process.env.NODE_ENV || 'development').toLowerCase() == 'production';
};
/** console log a significant message about logic that has been deprecated */
exports.ackX["deprecated"] = function (msg) {
    if (global.deprecatedMessages && global.deprecatedMessages[msg]) {
        return; //msg has already been logged once
    }
    global.deprecatedMessages = global.deprecatedMessages || {};
    global.deprecatedMessages = msg;
    /*
    https://en.wikipedia.org/wiki/ANSI_escape_code

    color number lookup (red:31,green:32) - http://ascii-table.com/ansi-escape-sequences.php
    \x1b[31m - red
    \x1b[32m - green
    \x1b[33m - yellow
    \x1b[34m - blue
    \x1b[30m - black
    \x1b[00m - reset
    */
    var modMsg = '\x1b[33m' + msg + '\x1b[00m'; //yellow then back to black
    console.warn(modMsg);
    var trace = exports.ackX["error"](new Error()).getStackArray()[3];
    console.warn('\x1b[33m->' + trace + '\x1b[00m');
};
