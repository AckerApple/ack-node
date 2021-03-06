# ack-node
Common server-side functionality, wrapped in one package, the Acker way

### Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Modules](#modules)
  - [ack.router](#ackrouter)
  - [ack.promise](#ackpromise)
  - [ack.ip](#ackip)
  - [ack.path](#ackpath)
  - [ack.file](#ackfile)
  - [ack.jwt](#ackjwt)
  - [ack.req](#ackreq)
  - [ack.reqres](#ackreqres)
  - [ack.router](#ackrouter)
- [ack-x](#ack-x)

## Installation
```bash
$ npm install ack-node --save
```

## Usage
```javascript
var ack = require('ack-node')
```

## Modules

### ack.promise
See [ack-p](https://www.npmjs.com/package/ack-p) for full details

#### executed already running promise
```javascript
ack.promise('val1','val2').then((v1,v2)=>console.log(v1,v2))
```

#### ack.Promise
Traditional resolve/reject promise
```javascript
ack.Promise((res,rej)=>{}).then()
```

### ack.ip
Internet Protocol address functionality
```javascript
/** matches 192.168 and other internal network ips */
ack.ip('192.168.0.0').isPrivate()

/** matches host machine ips */
ack.ip('127.0.0.0').isHost()
```

### ack.path - system directory functionality
See [ack-path](https://www.npmjs.com/package/ack-path) for full details
```javascript
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
```javascript
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
json web tokens. See [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) for full details

```javascript
var payload = {some:'data',hello:'world'}
var signed = ack.jwt(payload,'your-secret-key').sign()

ack.jwt(signed,'your-secret-key').verify().then(payload)
```

### ack.req
Outbound http/https requests based on functionality provived by [request](https://www.npmjs.com/package/request)

Send Example
```javascript
ack.req(url)
.send()
.then((body,response)=>console.log(body))
.catch(e=>console.error(e))
```

Send Example Without Promise Spread
```javascript
ack.req(url).set('spread',false)
.send()
.then(response=>console.log(response.body))
.catch(e=>console.error(e))
```

Post Example
```javascript
ack.req(url).post(data)
.then((body,response)=>console.log(body))
.catch(e=>console.error(e))
```

Put Example
```javascript
ack.req(url).put(data)
.then((body,response)=>console.log(body))
.catch(e=>console.error(e))
```

Delete Example
```javascript
ack.req(url).delete()
.then((body,response)=>console.log(body))
.catch(e=>console.error(e))
```

### ack.reqres
Request response handler

sendJson(variable, pretty)
```javascript
app.use((req,res)=>{
  ack.reqres(req,res).sendJSON( {hello:"world"} )
})
```

send file
```javascript
app.use((req,res)=>{
  const reqres = ack.reqres(req,res)
  reqres.input.header('content-type','application/pdf')
  reqres.send( pdfVar )
})
```

### ack.router
Access to Middleware

```javascript
const ackRouters = require('ack-node').router()
```

Mix with Connect or Express
```javascript
var app = require('express')()//common request routing app

//Ignore fav.ico, timeout in 3000ms, and all requests will be gzipped if applicable
app.get('/', ackRouters.ignoreFavors(), ackRouters.timeout(3000), ackRouters.compress)
```

#### Router Table of Contents
- [.cacheFor(seconds)](#cacheforseconds)
- [.notFound( optional_message )](#notfound-optional_message)
- [.timeout(ms, options)](#timeoutms-options)
- [.compress(options)](#compressoptions)
- [.cors(options)](#cors)
- [.relocate(url)](#relocate)
- [.ignoreFavors()](#ignorefavors)
- [.closeDevErrors()](#closedeverrors)
- [.htmlCloseError(options)](#htmlcloseerror)
- [.jsonCloseError(options)](#jsoncloseerror)
- [.closeProductionErrors()](#closeproductionerrors)
- [.consoleNonProductionErrors(options)](#consolenonproductionerrors)
- [.urlVarAsAuthHeader(varName)](#urlvarasauthheadervarname)
- [.cookieAsAuthHeader(varName)](#cookieasauthheadervarname)
- [.jwt(secret,options)](#jwtsecretoptions)
- [.logging(format,options)](#loggingformatoptions)
- [.logToArray(options)](#logtoarrayoptions)
- [.errorsToArray(options)](#errorstoarrayoptions)
- [.uploadByName(name, options)](#uploadbynamename-options)
- [.methodNotAllowed(message)](#methodnotallowedmessage)
- [.throw(ErrorOrMessage)](#throwerrorormessage)
- [.parseBody(options)](#parsebody)
- [.parseMultipartFields()](#parsemultipartfields)
- [.uploadOneByName(name, options)](#uploadonebynamename-options)
- [.uploadOneByNameToPath(name, path, options)](#uploadonebynametopathname-options)
- [.uploadArrayByName(name, options)](#uploadarraybynamename-options)
- [.localNetworkOnly(message)](#localnetworkonlymessage)
- [.noRobots()](#norobots)


##### .cacheFor(seconds)
- return middleware that sets cache-control header for every request

##### .notFound( optional_message )
- optional_message: default='Not Found - ${path}'


##### .timeout(ms, options)
- returns middleware that forces requests to timeout. Uses npm connect-timeout


##### .compress(options)
- returns middleware that GZIP requests. See npm compression

##### .cors(options)
- returns middleware for cross orgin services
- **options** {origin:'url-string'}. No options means allow all. See package cors

##### .relocate(url)
- return middleware that pushes requests to a new url

##### .ignoreFavors()
- returns middleware that 404s requests matching typical fav.ico files

##### .closeDevErrors()
- returns middleware that closes errors with crucial details needed during development

##### .htmlCloseError(options)
- Returns universal error handler middleware
- **options** {debug:true/false, debugLocalNetwork:true}

##### .jsonCloseError(options)
- returns middleware that handles errors with JSON style details
- **options** {debug:true/false, debugLocalNetwork:true}

##### .closeProductionErrors()
- returns middleware that conditions errors returned to provide useful responses without exact detail specifics on excepetions thrown

##### .consoleNonProductionErrors(options)
- returns middleware that conditions errors returned to provide useful responses with exact detail specifics on excepetions thrown

##### .urlVarAsAuthHeader(varName)
- returns middleware that upgrades a url variable into an Authorization header


##### .cookieAsAuthHeader(varName)
- returns middleware that upgrades a cookie variable into an Authorization header

##### .jwt(secret,options)
- returns middleware that handles the processing of JWT

- **options** {...}
  - requestKeyName: 'auth'//where parsed data will live (aka as requestProperty)

##### .logging(format,options)
returns middleware that makes server logging colorful and useful. Request-end result logging. See npm morgan.

- **format**
  - default dev env format: 'dev' aka ':method :url :status :res[content-length] - :response-time ms'
  - default pro env format: ':http-version/:method :url-short :colored-status :res[content-length] - :response-time ms :remote-addr :remote-user'
  - "url-short" is a custom made morgan.token()
  - "colored-status" is a custom made morgan.token()

##### .logToArray(options)
returns middleware the records requests to an array of specified maxLength. Uses [.logging(format,options)](#loggingformatoptions)

- **options**
  - array:[]
  - maxLength:25

##### .errorsToArray(options)
returns middleware the records errors to an array of specified maxLength

- **options**
  - array:[]
  - maxLength:25

##### .uploadByName(name, options)
- returns middleware that uploads files. Creates req.files array
- **options - see function paramUploadOptions

##### .methodNotAllowed(message)
- returns middleware that throws 405 errors on request

##### .throw(ErrorOrMessage)
- returns middleware that throws 400 errors on request

##### .parseBody(options)
- returns middleware that parses request bodies into request.body object
- **options**
  - limit:102400
  - [see bodyParser for more](https://github.com/expressjs/body-parser)

##### .parseMultipartFields()
- returns middleware that parse multi-part requests. Creates request.body which contains all form post fields

> NOTE: Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream

##### .uploadOneByName(name, options)
- returns middleware that uploads only one file. Creates req[name] file
- **options** - see function paramUploadOptions
  - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
  - Any BODY/POST variables will be parsed and made available as req.body

##### .uploadOneByNameToPath(name, path, options)
- for more information see uploadOneByName
- **name** - input file field name expected to receive file on
- **path** - exact file path or if folder path, then file upload name will be used
- **options** - see function paramUploadOptions

> NOTES:
> - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
> - Any BODY/POST variables will be parsed and made available as req.body

##### .uploadArrayByName(name, options)
- returns middleware that uploads an array of files. Creates req[name] array
- **options** - see function paramUploadOptions
  - Cannot be used with any other multipart reader/middleware. Only one middleware can read a stream
  - Any BODY/POST variables will be parsed and made available as req.body

##### .localNetworkOnly(message)
- returns middleware that only allows local network requests

##### .noRobots()
- returns middleware that responds with a text/plain message of "User-agent: *\rDisallow: /"

## ack-x
Additional lower level functionality is provided by [ack-x](https://www.npmjs.com/package/ack-x)

Date Example
```javascript
require('ack-node').date().now().mmddyyyy()
```

The above and many more examples of modules provided by [ack-x can be seen here](https://www.npmjs.com/package/ack-x)