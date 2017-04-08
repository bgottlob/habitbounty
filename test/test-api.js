var assert = require('assert');
var http = require('http');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

var hbHost = 'localhost';
var hbPort = 8080
function get(path) {
  return new Promise(function (resolve, reject) {
    http.get({ host: hbHost, port: hbPort, path: '/' + path },
      function(res) {
        res.setEncoding('utf8');
        /* Request was unsuccessful */
        if (res.statusCode < 200 || res.statusCode >= 300) {
          /* Consume the rest of the response, to free memory */
          res.resume();
          reject(res);
        } else {
          let body = [];
          res.on('data', (chunk) => {
            body.push(chunk);
          });
          res.on('end', () => {
            body = JSON.parse(body.join());
            res.body = body;
            resolve(res);
          });
        }
      });
  });
}

function post(path, body) {
  return new Promise(function (resolve, reject) {
    let req = http.request({
      method: 'POST',
      host: hbHost,
      port: hbPort,
      path: '/' + path
    },
      function(res) {
        res.setEncoding('utf8');
        /* Request was unsuccessful */
        if (res.statusCode < 200 || res.statusCode >= 300) {
          /* Consume the rest of the response, to free memory */
          res.resume();
          reject(res);
        } else {
          let body = [];
          res.on('data', (chunk) => {
            body.push(chunk);
          });
          res.on('end', () => {
            body = JSON.parse(body.join());
            res.body = body;
            resolve(res);
          });
        }
      });
    req.write(JSON.stringify(body));
    req.end();
  });
}

function put(path, body) {
  return new Promise(function (resolve, reject) {
    let req = http.request({
      method: 'PUT',
      host: hbHost,
      port: hbPort,
      path: '/' + path
    },
      function(res) {
        res.setEncoding('utf8');
        /* Request was unsuccessful */
        if (res.statusCode < 200 || res.statusCode >= 300) {
          /* Consume the rest of the response, to free memory */
          res.resume();
          reject(res);
        } else {
          let body = [];
          res.on('data', (chunk) => {
            body.push(chunk);
          });
          res.on('end', () => {
            body = JSON.parse(body.join());
            res.body = body;
            resolve(res);
          });
        }
      });
    console.log(JSON.stringify(body));
    req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Habit Requests', function() {
  describe('All Habits', function() {
    it('should return an empty array', function(done) {
      get('all-habits').then(function(response) {
        assert.deepStrictEqual(response.body, [],
          'the API should have responded with no data');
        done();
      }).catch(function(errResponse) {
        assert(false, 'the request should have been successful :(');
        done(errResponse);
      });
    });
  });

  describe('Create Habit', function() {
    it('should return a habit that shows up in all habits', function(done) {
      put('habit', {
        name: 'First Test Habit',
        amount: 3.25
      }).then(function (res) {
        console.log('Resolved!');
        assert(res.body.id);
        console.log('Bang')
        assert(res.body.rev);
        console.log('Bang')
        assertEqual(res.body.name, 'First Test Habit');
        console.log('Bang')
        assertEqual(res.body.amount, 3.25);
        console.log('Bang')
        done();
      }).catch(function(errRes) {
        console.log('Resolved!');
        assert(false, 'the request should have been successful :(');
        done(errResponse);
      })
    });

  });

  after(function() {
    console.log('Calling db cleanup');
    let loader = require('../modules/dataLoader.js');
    loader.deleteDB('habitbounty-unit-test').then(function (res) {
      console.log('Deleted db successfully, finished test');
      done();
    }).catch(function (err) {
      console.log("Couldn't delete db");
      console.log(err);
      done();
    });
  })
});
