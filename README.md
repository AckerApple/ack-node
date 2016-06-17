# ack-node
Common server-side functionality, wrapped in one package, the Acker way


## Install
```
$ npm install ack-node --save
```

## Usage
```
var ack = require('ack-node')
```

### ack.promise - executed already running promise
```
ack.promise('val1','val2').then((v1,v2)=>console.log(v1,v2))
```

### ack.Promise - Promise
```
ack.Promise((res,rej)=>{}).then()
```

### ack.ip - Internet Protocol address functionality
```
/** matches 192.168 and other internal network ips */
ack.ip('192.168.0.0').isPrivate()

/** matches host machine ips */
ack.ip('127.0.0.0').isHost()
```

### ack.file - system file functionality
```
ack.file(__dirname).delete().then()
ack.file(__dirname).getMimeType()//Ex: application/javascript
ack.file(__dirname).stat().then(stats=>stats.size)
ack.file(__dirname).write(string).then()
ack.file(__dirname).append(string).then()
```

### ack.path - system directory functionality
```
//created directory if not existant
ack.path(__dirname).paramDir().then()

//string manipulation
ack.path(__dirname).join('a','b','c.js').path// = __dirname/a/b/c.js

//string manipulation
ack.path('/test/file.js').removeExt().path// = /test/file

//string manipulation
ack.path('/test/file').removeExt().path// = /test/file

//string manipulation
ack.path('/test/file.js').removeFile().path// = /test/

//string manipulation
ack.path('/test/').removeFile().path// = /test/

//path delete promise
ack.path(__dirname).delete().then()

ack.path(__dirname).sync().exists()//NONASYNC
```

### ack.jwt - json web tokens
```
var payload = {some:'data',hello:'world'}
var signed = ack.jwt(payload,'your-secret-key').sign()

ack.jwt(signed,'your-secret-key').verify().then(payload)
```

### ack.req - outbound http/https requests
```
ack.req(url).send().then(body,response)
ack.req(url).put(data).then(body,response)
ack.req(url).delete().then(body,response)
```

### ack.router - middleware
```
//INIT EXAMPLE, how all middleware is intended to be used
var app = require('express')()//common request routing app
var rs = require('ack-node').router()//get our ack routers
//Now our app will ignore fav.ico, timeout in 3000ms, and all requests will be gzipped if applicable
app.get('/', rs.ignoreFavors(), rs.timeout(3000), rs.compress)

//Below is just blobs of use cases

/** returns middleware that sets cache-control header for every request */
ack.router().cacheFor(seconds)

/** returns middleware that throws 404 file not found errors */
ack.router().notFound()

/** returns middleware that forces requests to timeout. Uses npm connect-timeout */
ack.router().timeout(ms, options)

/** returns middleware that GZIP requests. See npm compression */
ack.router().compress(options)

/** returns middleware for cross orgin services
  @options{origin:'url-string'}. No options means allow all. See package cors
*/
ack.router().cors(options)

/** return middleware that pushes requests to a new url */
ack.router().relocate(url)

/** returns middleware that 404s requests matching typical fav.ico files */
ack.router().ignoreFavors()

/** returns middleware that closes errors with crucial details needed during development  */
ack.router().closeDevErrors()

/** Returns universal error handler middleware
  @options {debug:true/false, debugLocalNetwork:true}
*/
ack.router().htmlCloseError(options)

/** returns middleware that handles errors with JSON style details
  @options {debug:true/false, debugLocalNetwork:true}
*/
ack.router().jsonCloseError(options)


/** returns middleware that conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown */
ack.router().closeProductionErrors()

/** returns middleware that conditions errors returned to provide useful responses with exact detail specifics on excepetions thrown */
ack.router().consoleNonProductionErrors(options)

/** returns middleware that upgrades a url variable into an Authorization header */
ack.router().urlVarAsAuthHeader(varName)

/** returns middleware that upgrades a cookie variable into an Authorization header */
ack.router().cookieAsAuthHeader(varName)

/** returns middleware that handles the processing of JWT
  @options - {
    requestKeyName: 'auth'//where parsed data will live (aka as requestProperty)
  }
*/
ack.router().jwt(secret,options)

/** returns middleware that makes server logging colorful and useful
  request-end result logging. see npm morgan
  default dev format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
  default pro format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'

  format url-short is a custom morgan.token()
  format colored-status is a custom morgan.token()
*/
ack.router().logging(format,options)

/** returns middleware that uploads files. Creates req.files array
  @options - see function paramUploadOptions
*/
ack.router().uploadByName(name, options)

/** returns middleware that throws 405 errors on request */
ack.router().methodNotAllowed(message)

/** returns middleware that throws 400 errors on request */
ack.router().throw(ErrorOrMessage)

/** returns middleware that parses request bodies */
ack.router().parseBody(options)

/** returns middleware that parse multi-part requests. Creates request.body which contains all form post fields
  NOTE: Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
*/
ack.router().parseMultipartFields()

/** returns middleware that uploads only one file. Creates req[name] file
  @options - see function paramUploadOptions
  NOTES:
    - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
    - Any BODY/POST variables will be parsed and made available as req.body
*/
ack.router().uploadOneByName(name, options)

/** returns middleware that uploads an array of files. Creates req[name] array
  @options - see function paramUploadOptions
  NOTES:
  - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
  - Any BODY/POST variables will be parsed and made available as req.body
*/
ack.router().uploadArrayByName(name, options)

/** returns middleware that only allows local network requests */
ack.router().localNetworkOnly(message)
```