# ack-node
Common server-side functionality, wrapped in one package, the Acker way

### Table of Contents
- [Installation](#installation)
- [Usage](#usage)
    - [ack.router](#ackrouter)
    - [ack.promise](#ackpromise)
    - [ack.ip](#ackip)
    - [ack.path](#ackpath)
    - [ack.file](#ackfile)
    - [ack.jwt](#ackjwt)
    - [ack.req](#ackreq)
    - [ack.reqres](#ackreqres)
    - [ack.router](#ackrouter)

## Installation
```
$ npm install ack-node --save
```

## Usage
```
var ack = require('ack-node')
```

### ack.promise

#### executed already running promise
```
ack.promise('val1','val2').then((v1,v2)=>console.log(v1,v2))
```

#### ack.Promise
Traditional resolve/reject promise
```
ack.Promise((res,rej)=>{}).then()
```

### ack.ip
Internet Protocol address functionality
```
/** matches 192.168 and other internal network ips */
ack.ip('192.168.0.0').isPrivate()

/** matches host machine ips */
ack.ip('127.0.0.0').isHost()
```

### ack.path - system directory functionality
See [ack-path](https://www.npmjs.com/package/ack-path) for full details
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

### ack.file
System file functionality

See [ack-path](https://www.npmjs.com/package/ack-path) for full details
```
ack.file(__dirname).delete().then()
ack.file(__dirname).getMimeType()//Ex: application/javascript
ack.file(__dirname).stat().then(stats=>stats.size)
ack.file(__dirname).write(string).then()
ack.file(__dirname).append(string).then()

//string manipulations
ack.file(__dirname).join('test-file.js').path
ack.file(__dirname).Join('test-file.js').path//creates new instance, leaving original alone
ack.file(__dirname).join('test-file.js').removeExt().path//Manipulates path by removing one file extension
```

### ack.jwt
json web tokens
```
var payload = {some:'data',hello:'world'}
var signed = ack.jwt(payload,'your-secret-key').sign()

ack.jwt(signed,'your-secret-key').verify().then(payload)
```

### ack.req
Outbound http/https requests
```
ack.req(url).send().then(body,response)
ack.req(url).put(data).then(body,response)
ack.req(url).delete().then(body,response)
```

### ack.reqres
Request response handler

send file
```
app.use((req,res)=>{
  const reqres = ack.reqres(req,res)
  reqres.input.header('content-type','application/pdf')
  reqres.send( pdfVar )
})
```

### ack.router
Access to Middleware

```
const ackRouters = require('ack-node').router()
```

- Mix with Connect or Express
```
var app = require('express')()//common request routing app

//Ignore fav.ico, timeout in 3000ms, and all requests will be gzipped if applicable
app.get('/', ackRouters.ignoreFavors(), ackRouters.timeout(3000), ackRouters.compress)
```

- returns middleware that sets cache-control header for every request
```
ackRouters.cacheFor(seconds)
```

- returns middleware that throws 404 file not found errors
```
ackRouters.notFound()
```

- returns middleware that forces requests to timeout. Uses npm connect-timeout
```
ackRouters.timeout(ms, options)
```

- returns middleware that GZIP requests. See npm compression
```
ackRouters.compress(options)
```

- returns middleware for cross orgin services
> @options{origin:'url-string'}. No options means allow all. See package cors

```
ackRouters.cors(options)
```

- return middleware that pushes requests to a new url
```
ackRouters.relocate(url)
```

- returns middleware that 404s requests matching typical fav.ico files
```
ackRouters.ignoreFavors()
```

- returns middleware that closes errors with crucial details needed during development
```
ackRouters.closeDevErrors()
```

- Returns universal error handler middleware
> @options {debug:true/false, debugLocalNetwork:true}

```
ackRouters.htmlCloseError(options)
```

- returns middleware that handles errors with JSON style details
> @options {debug:true/false, debugLocalNetwork:true}

```
ackRouters.jsonCloseError(options)
```

- returns middleware that conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown
```
ackRouters.closeProductionErrors()
```

- returns middleware that conditions errors returned to provide useful responses with exact detail specifics on excepetions thrown
```
ackRouters.consoleNonProductionErrors(options)
```

- returns middleware that upgrades a url variable into an Authorization header
```
ackRouters.urlVarAsAuthHeader(varName)
```

- returns middleware that upgrades a cookie variable into an Authorization header
```
ackRouters.cookieAsAuthHeader(varName)
```

- returns middleware that handles the processing of JWT
> @options - {
>   requestKeyName: 'auth'//where parsed data will live (aka as requestProperty)
> }

```
ackRouters.jwt(secret,options)
```

- returns middleware that makes server logging colorful and useful
> request-end result logging. see npm morgan
> default dev format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
> default pro format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'
> format url-short is a custom morgan.token()
> format colored-status is a custom morgan.token()

```
ackRouters.logging(format,options)
```

- returns middleware that uploads files. Creates req.files array
> @options - see function paramUploadOptions

```
ackRouters.uploadByName(name, options)
```

- returns middleware that throws 405 errors on request
```
ackRouters.methodNotAllowed(message)
```

- returns middleware that throws 400 errors on request
```
ackRouters.throw(ErrorOrMessage)
```

- returns middleware that parses request bodies into request.body object
    - options
        - limit:102400
    - [see bodyParser for more](https://github.com/expressjs/body-parser)
```
ackRouters.parseBody(options)
```


- returns middleware that parse multi-part requests. Creates request.body which contains all form post fields
> NOTE: Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream

```
ackRouters.parseMultipartFields()
```

- returns middleware that uploads only one file. Creates req[name] file
> @options - see function paramUploadOptions
> NOTES:
>   - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
>   - Any BODY/POST variables will be parsed and made available as req.body

```
ackRouters.uploadOneByName(name, options)
```

- returns middleware that uploads an array of files. Creates req[name] array
>  @options - see function paramUploadOptions
>  NOTES:
>  - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
>  - Any BODY/POST variables will be parsed and made available as req.body

```
ackRouters.uploadArrayByName(name, options)
```

- returns middleware that only allows local network requests
```
ackRouters.localNetworkOnly(message)
```