# ack-node - Change Log
All notable changes to this project will be documented here.

## [1.3.1] - 2017-02-08
### Enhanced
- error routers and handlers

## [1.3.0] - 2017-02-08
### Updated ack-path, which has breaking changes

## [1.2.12] - 2017-01-31
### Added
- ack.router().noRobots

## [1.2.10] - 2017-01-31
### Added
- ack.request().set()
### Enhanced
- ack.request().send(url,option) added option.spread

## [1.2.1] - 2017-01-23
### Enhanced
- ack.router().jsonCloseError() to first try to close errors with res.json

## [1.2.0] - 2017-01-23
### Upgraded Dependencies

## [1.1.9] - 2017-01-23
### Enhanced
- ack.router().errorsToArray() now adds server key to error object with request headers

## [1.1.6] - 2017-01-19
### Enhanced
- ack.router().errorsToArray() properly converts strings to errors

## [1.1.5] - 2017-01-04
### Enhanced
- ack.router().errorsToArray() now makes hidden error details visible

## [1.1.2] - 2016-12-27
### Added
- ack.router().logToArray(options)

## [1.1.1] - 2016-12-26
### Added
- ack.router().errorsToArray(options)

## [1.1.0] - 2016-12-20
### Added
- ack().req().postVar() to set post form variables
### Breaking Change
- ack().req().post() is now to send a post body
  - ack().req().postVar()

## [1.0.32] - 2016-12-14
### Enhanced
- ack.routers().respond() now accepts a function

## [1.0.31] - 2016-12-01
### Updated
- ack.path from 1.2.1 to 1.3.0

## [1.0.30] - 2016-11-29
### Fixed
- router to send error message header fixed

## [1.0.29] - 2016-11-23
### Changed
- replaced jade with pug

## [1.0.28] - 2016-11-22
### Updated
- jsonwebtoken from 7.0.1 to 7.1.9
### Added
- uploadOneByNameToPath

## [1.0.27] - 2016-11-21
### Enhanced
- cors now allows all known safe headers by default

## [1.0.26] - 2016-11-18
### Added
- add message argument to routers().notFound(msg)

## [1.0.25] - 2016-11-17
### Added
- reqres.res.sendJSON now has second parameter to allow pretty JSON

## [1.0.24] - 2016-10-18
### Fixed
- Connected bodyParser options

## [1.0.23] - 2016-10-18
### update ack-path from 1.0.1 to 1.1.0

## [1.0.11] - 2016-08-03
### added default maxAge response for cors

## [1.0.6] - 2016-06-17
### Docs, just documenting more

## [1.0.3] - 2016-06-16
### Created