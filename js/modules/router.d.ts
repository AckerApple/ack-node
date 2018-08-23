declare var ack: any, morgan: any, multer: any, bodyParser: any, //used to parse inbound request form post variables
multiparty: any, //used to parse inbound request form multi/part post variables
cors: any, //controls cross origin requests
upj: any, connectTimeout: any, compression: any;
declare var safeHeaders: string[];
declare var isProNode: boolean;
declare function errorsToArray(options: any): (err: any, req: any, res: any) => void;
declare function upgradeServerError(err: any, req: any, res: any): any;
declare function arrayPrependServerError(array: any, err: any, options: any): void;
declare function getMorganDefaultFormat(options: any, add?: any): string;
declare function paramUploadOptions(options: any): void;
/** Returns universal error handler middleware
  @options {debug:true/false, debugLocalNetwork:true}
*/
declare function htmlCloseError(options: any): (err: any, req: any, res: any, next?: any) => void;
declare function cleanStatusMessage(statusMessage: any): any;
declare function toError(err: any): any;
/** returns middleware that handles errors with JSON style details
  @options {debug:true/false, debugLocalNetwork:true}
*/
declare function jsonCloseError(options?: any): (err: any, req: any, res: any, next?: any) => void;
declare function maxArrayPush(array: any, item: any, max: any): any;
declare function maxArrayUnshift(array: any, item: any, max: any): any;
