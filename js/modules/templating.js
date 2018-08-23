"use strict";
exports.__esModule = true;
var jade = require("pug");
var templating = /** @class */ (function () {
    function templating(filePathOrOptions) {
        switch (typeof filePathOrOptions) {
            case 'string':
                this.options = { filePath: filePathOrOptions };
                break;
            default: this.options = filePathOrOptions || {};
        }
    }
    templating.prototype.compile = function () {
        return jade.compileFile(this.options.filePath, this.options);
    };
    templating.prototype.render = function (locals) {
        return jade.renderFile(this.options.filePath, locals);
    };
    return templating;
}());
exports.templating = templating;
function method(filePathOrOptions) {
    return new templating(filePathOrOptions);
}
exports.method = method;
