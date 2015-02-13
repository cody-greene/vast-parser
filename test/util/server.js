'use strict';

var http = require('http')
var https = require('https')
var pem = require('pem')

var PORT = 6969
var SSL_PORT = 16969
var server = module.exports

// Start or stop a test server (server.$)
server.url = 'http://localhost:' + PORT
server.start =  function startServer(done) {
  server.$ = http.createServer().listen(PORT, done)
}
server.stop = function stopServer(done) {
  server.$.close(done)
}

// Start or stop a test server with SSL (server.ssl.$)
server.ssl = {}
server.ssl.url = 'https://localhost:' + SSL_PORT
server.ssl.start = function startServerSSL(done) {
  getCert(function (err, certAndKey) {
    if (err) return done(err)
    server.ssl.$ = https.createServer(certAndKey).listen(SSL_PORT, done)
  })
}
server.ssl.stop = function stopServerSSL(done) {
  server.ssl.$.close(done)
}

// Generate a self-signed certificate for the SSL server
// (server.ssl._)
function getCert(done) {
  if (server.ssl._) done(null, server.ssl._)
  pem.createCertificate({
    days: 1,
    selfSigned: true
  }, function rootCertCallback(err, root) {
    if (err) return done(err)
    pem.createCertificate({
      serviceCertificate: root.certificate,
      serviceKey: root.serviceKey,
      serial: Date.now(),
      days: 500,
      country: '',
      state: '',
      locality: '',
      organization: '',
      organizationUnit: '',
      commonName: 'tmp.test'
    }, function certCallback(err, client) {
      if (err) return done(err)
      done(null, server.ssl._ = {
        ca: root.certificate,
        key: client.clientKey,
        cert: client.certificate
      })
    })
  })
}
