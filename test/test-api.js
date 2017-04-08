var assert = require('assert');
var http = require('http');
var host = 'http://localhost:8080';
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

describe('Habit Requests', function() {
  describe('All Habits', function() {
    it('should return an empty array', function(done) {
      http.get({
        host: 'localhost',
        port: 8080,
        path: '/all-habits'
      }, function(res) {
        res.setEncoding('utf8');
        let body = [];
        res.on('data', (chunk) => {
          body.push(chunk);
        });
        res.on('end', () => {
          body = JSON.parse(body.join());
          assert.deepEqual([], body);
          done();
        });
      });
    });
  });
});
