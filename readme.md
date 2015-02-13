### vast-parser
This is a work in progress. [VAST 3.0](http://www.iab.net/media/file/VASTv3.0.pdf) parser. Ultimately converts XML into a plain old javascript object. This can stream the source XML from a local file or over http. This should also have decent test coverage, using [mocha](http://mochajs.org). Also, useful logging is provided with [bunyan](https://github.com/trentm/node-bunyan).

### Testing
`npm test` will run the entire test suite. Use the `--` separator to pass additional arguments into the test-runner (make sure you have the latest version of npm). See [mocha](http://mochajs.org) for more options. If you only want to run certain tests, then try
```sh
# Match by test descriptor
npm test -- --grep='should work on a local file'
# Match by file name
npm test -- test/get
```
`npm run trace` will display detailed logs after running the tests. See [bunyan](https://github.com/trentm/node-bunyan) for more options. Put it all together as a one-liner with
```sh
npm test -- test/parser; npm run trace -- --level debug
```
