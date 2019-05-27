export declare const safeHeaders: string[];
/** returns middleware that responds with a text/plain message of "User-agent: *\rDisallow: /" */
export declare const noRobots: () => (req: any, res: any, next: any) => void;
/** returns middleware that sets cache-control header for every request */
export declare const cacheFor: (seconds: any) => (req: any, res: any, next: any) => void;
/** returns middleware that throws 404 file not found errors */
export declare const notFound: (msg: any) => (req: any, res: any, next: any) => void;
/** returns middleware that forces requests to timeout. Uses npm connect-timeout */
export declare const timeout: (ms: any, options: any) => any;
/** returns string to requests
  @string - string or object. Objects will be sent as JSON output. If function(req,res,next) then result of function will be sent
*/
export declare const respond: (string: any, options: any) => (req: any, res: any, next: any) => Promise<void>;
/** returns middleware that GZIP requests. See npm compression */
export declare const compress: (options: any) => any;
/** returns middleware for cross orgin services
  @options{
    origin:'*',
    maxAge: 3000//Access-Control-Allow-Max-Age CORS header default 50 minutes
    exposedHeaders:module.exports.safeHeaders//headers server is allowed to send
    allowedHeaders:module.exports.safeHeaders//headers server is allowed to receive
  }
*/
export declare const cors: (options: any) => any;
/** return middleware that pushes requests to a new url */
export declare const relocate: (url: any) => (req: any, res: any, next: any) => void;
/** returns middleware that 404s requests matching typical fav.ico files */
export declare const ignoreFavors: (statusCode: any) => (req: any, res: any, next: any) => void;
export declare const ignoreFavIcon: (statusCode: any) => (req: any, res: any, next: any) => void;
/** routes errors onto an array of a specified maxLength. Great for just sending error to report servers errors. Params datetime key of errors.
  @options{
    array:[],
    maxLength:25
  }
*/
export declare const errorsToArray: (options: any) => (err: any, req: any, res: any, next: any) => void;
export declare const handlers: {
    errorsToArray: (options: any) => (err: any, req: any, res: any, next: any) => void;
};
/** returns error middleware(err,req,res,next) that when called, calls callback
  - Error middleware returns void
*/
export declare const errorCallback: (callback: any) => (err: any, req: any, res: any, next: any) => void;
/** returns middleware that closes errors with crucial details needed during development
    hint: must be last middleware AFTER routes that MAY have an error
*/
export declare const closeDevErrors: () => (err: any, req: any, res: any, next: any) => void;
/** returns middleware that conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown
    hint: must be last middleware AFTER routes that MAY have an error
*/
export declare const closeProductionErrors: () => (err: any, req: any, res: any, next: any) => void;
/** returns middleware that conditions errors returned to provide useful responses with exact detail specifics on excepetions thrown
    hint: must be last middleware AFTER routes that MAY have an error
*/
export declare const consoleNonProductionErrors: (options: any) => (err: any, req: any, res: any, next: any) => void;
/** returns middleware that upgrades a url variable into an Authorization header */
export declare const urlVarAsAuthHeader: (varName: any) => (req: any, res: any, next: any) => void;
/** returns middleware that upgrades a cookie variable into an Authorization header */
export declare const cookieAsAuthHeader: (varName: any) => (req: any, res: any, next: any) => void;
/** returns middleware that handles the processing of JWT
  @options - {
    requestKeyName: 'auth'//where parsed data will live (aka as requestProperty)
  }
*/
export declare const jwt: (secret: any, options: any) => (req: any, res: any, next: any) => any;
/** returns middleware that makes server logging colorful and useful
  request-end result logging. see npm morgan
  default dev format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
  default pro format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'

  format url-short is a custom morgan.token()
  format colored-status is a custom morgan.token()

  @options{
    stream - Output stream for writing log lines, defaults to process.stdout
  }
*/
export declare const logging: (format: any, options: any) => any;
/** uses logging(format,options) to build an array of string, with a specific maxLength, that record requests
  @options{
    array:[],
    maxLength:100
  }
*/
export declare const logToArray: (options: any) => any;
/** returns middleware that uploads files. Creates req.files array
  @options - see function paramUploadOptions
*/
export declare const uploadByName: (name: any, options: any) => any;
/** returns middleware that throws 405 errors on request */
export declare const methodNotAllowed: (message: any) => any;
/** returns middleware that throws 400 errors on request */
export declare const throwMidware: (ErrorOrMessage: any) => (req: any, res: any, next: any) => void;
/**
  returns middleware that parses request bodies
  @options - {
    limit:102400//max bytes for body
  }
*/
export declare const parseBody: (options: any) => (req: any, res: any, next: any) => any;
/** returns middleware that parse multi-part requests. Creates request.body which contains all form post fields
  NOTE: Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
*/
export declare const parseMultipartFields: () => (req: any, res: any, next: any) => any;
/** returns middleware that uploads only one file. Creates req[name] file
  @name - input file field name expected to receive file on
  @options - see function paramUploadOptions
  NOTES:
    - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
    - Any BODY/POST variables will be parsed and made available as req.body
*/
export declare const uploadOneByName: (name: any, options: any) => (req: any, res: any, next?: any) => any;
/** for more information see uploadOneByName
  @name - input file field name expected to receive file on
  @path - exact file path or if folder path, then file upload name will be used
  @options - see function paramUploadOptions
  NOTES:
    - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
    - Any BODY/POST variables will be parsed and made available as req.body
*/
export declare const uploadOneByNameToPath: (name: any, path: any, options: any) => (req: any, res: any, next: any) => any;
/** returns middleware that uploads an array of files. Creates req[name] array
  @options - see function paramUploadOptions
  NOTES:
  - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
  - Any BODY/POST variables will be parsed and made available as req.body
*/
export declare const uploadArrayByName: (name: any, options: any) => any;
/** returns middleware that only allows local network requests */
export declare const localNetworkOnly: (message: any) => (req: any, res: any, next: any) => void;
/** Returns universal error handler middleware
  @options {debug:true/false, debugLocalNetwork:true}
*/
export declare function htmlCloseError(options: any): (err: any, req: any, res: any, next?: any) => void;
/** returns middleware that handles errors with JSON style details
  @options {debug:true/false, debugLocalNetwork:true}
*/
export declare function jsonCloseError(options?: any): (err: any, req: any, res: any, next?: any) => void;
