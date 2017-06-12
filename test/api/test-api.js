let assert = require('assert');
let http = require('http');
let loader = require('../modules/dataLoader.js');

var hbHost = 'localhost';
var hbPort = 8080

/**
 * The callback called when an HTTP request returns to parse the JSON result
 * @callback requestCallback
 * @param {function} resolve a resolution callback for creating a promise
 * @param {function} reject a rejection callback for creating a promise
 */
function httpPromiseCB(resolve, reject) {
  return function (res) {
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
  }
}

function get(path) {
  return new Promise(function (resolve, reject) {
    http.get({ host: hbHost, port: hbPort, path: '/' + path },
      httpPromiseCB(resolve, reject));
  });
}

function post(path, body) {
  return new Promise(function (resolve, reject) {
    let req = http.request({
      method: 'POST',
      host: hbHost,
      port: hbPort,
      path: '/' + path
    }, httpPromiseCB(resolve, reject));
    req.on('error', function (err) {
      console.log('problem with request: ' + err.message);
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
    }, httpPromiseCB(resolve, reject));
    req.on('error', function (err) {
      console.log('problem with request: ' + err.message);
    });
    req.write(JSON.stringify(body));
    req.end();
  });
}

/* Side effect: gets id and rev of the created habits */
function createDB(habits) {
  return function() {
    console.log('Setting up database');
    return loader.createDB().then(function (res) {
      if (habits && habits.length > 0) {
        return Promise.all(habits.map(function (habit) {
          return put('habit', { name: habit.name, amount: habit.amount });
        })).then(function (results) {
          for (let i = 0; i < habits.length; i++) {
            habits[i].id = results[i].body.id;
            habits[i].rev = results[i].body.rev;
          }
          return Promise.resolve(habits);
        });
      }
    }).catch(function (err) {
      assert(false, 'error occurred when creating database with habits ' +
        JSON.stringify(err.statusCode));
    });
  }
}

function deleteDB() {
  console.log('Calling db cleanup');
  return loader.deleteDB().then(function (res) {
    console.log('Deleted db successfully, finished test');
  }).catch(function (err) {
    console.log("Couldn't delete db");
    console.log(err.reason);
  });
}

function copyHabits(habits) {
  let res = [];
  for (let i = 0; i < habits.length; i++)
    res.push({ amount: habits[i].amount, name: habits[i].name });
  return res;
}

describe('Habit Requests', function() {
  describe('All Habits Empty', function() {
    before(createDB());
    after(deleteDB);
    it('should return an empty array', function() {
      return get('all-habits').then(function(response) {
        assert.deepStrictEqual(response.body, [],
          'the API should have responded with no data');
      }, function (err) {
        assert(false, 'should not have errored with ' + err.body);
      });
    });
  });

  let globHabits = [
    {
      name: 'First Test Habit',
      amount: 3.45
    },
    {
      name: 'Second Test Habit',
      amount: 0.43
    },
    {
      name: 'Third Test Habit',
      amount: 3.4
    },
    {
      name: 'Fourth Test Habit',
      amount: 0.5
    },
    {
      name: 'Fifth Test Habit',
      amount: 1
    }
  ];

  describe('Create Habit', function() {
    before(createDB());
    after(deleteDB);
    let habits = copyHabits(globHabits);
    for (let i = 0; i < habits.length; i++) {
      it('should return a newly created habit', function() {
        return put('habit', habits[i]).then(function (res) {
          assert(res.body.id);
          habits[i].id = res.body.id;
          habits[i].rev = res.body.rev;
          assert(res.body.rev);
          assert.strictEqual(res.body.name, habits[i].name);
          assert.strictEqual(res.body.amount, habits[i].amount);
        }).catch(function (err) {
          assert(false, err.body);
        });
      });
    }
    console.log(globHabits);
  });

  describe('Invalid Requests to PUT /habit', function() {
    before(createDB());
    after(deleteDB);
    let invalidBodies = [
      {},
      //{ name: 'Blah', amount: 'Blah' }, TODO: Fix this case
      { name: 'Blah' },
      { amount: 2 },
      { name: 'Blah', amount: 3, toomany: 'blah' }
    ];
    for (let i = 0; i < invalidBodies.length; i++) {
      it('should return a bad request error', function() {
        console.log('called invalid req!');
        return put('habit', invalidBodies[i]).then(function(res) {
          assert(false, 'request should have failed but succeeded:\n\t'
            + JSON.stringify(res.body));
        }, function (err) {
          assert.strictEqual(err.statusCode, 400);
        });
      });
    }
    it('should return an empty array since no habits should have been created',
      function() {
        console.log('called all habits!');
        return get('all-habits').then(function(response) {
          assert.deepStrictEqual(response.body, [],
            'the API should have responded with no data');
        }, function (err) {
          assert(false, 'should not have errored with ' + err.body);
        });
      }
    );
  });

  describe('Get Habits', function () {
    let habits = copyHabits(globHabits);
    before(createDB(habits));
    after(deleteDB);
    for (let i = 0; i < habits.length; i++) {
      it('should return habit data for each individual habit', function () {
        return get('habit/' + habits[i].id).then(function (result) {
          assert(result.body.rev);
          assert.strictEqual(result.body.id, habits[i].id);
          assert.strictEqual(result.body.name, habits[i].name);
          assert.strictEqual(result.body.amount, habits[i].amount);
          assert.deepStrictEqual(result.body.log, []);
        }, function (err) {
          assert(false, 'request should have succeeded');
        });
      });
    }
  });

  describe('Invalid Requests to GET /habit', function() {
    let habits = copyHabits(globHabits);
    before(createDB(habits));
    after(deleteDB);
    /* TODO: Edits these expected response codes to what they should be */
    let invalidPaths = [
      { path: habits[0].id + '/blah', expCode: 404 },
      { path: '/notarealid', expCode: 404 },
      { path: '/', expCode: 404 },
      { path: '', expCode: 404 },
      { path: '/null', expCode: 404 }
    ];
    for (let i = 0; i < invalidPaths.length; i++) {
      it('should return a bad request error', function() {
        let path = 'habit' + invalidPaths[i].path;
        return get(path).then(function(res) {
          assert(false, 'request should have failed but succeeded:\n\t'
            + JSON.stringify(res.body));
        }, function (err) {
          assert.strictEqual(err.statusCode, invalidPaths[i].expCode,
            'request to path ' + path + ' should have returned a ' +
            invalidPaths[i].expCode + ' status code');
        });
      });
    }
  });

  describe('Requests to POST /complete-habit', function() {
    let habits = copyHabits(globHabits);
    habits[0].log = [{ amount: 3.45, date: '2017-04-09' }];
    habits[1].log = [{ amount: 0.43, date: '2017-01-01' }];
    habits[2].log = [{ amount: 3.4, date: '2016-12-31' }];
    habits[3].log = [];
    habits[4].log = [];
    before(createDB(habits));
    after(deleteDB);

    for (let i = 0; i < habits.length; i++) {
      it('should complete a habit on the given date', function() {
        if (habits[i].log.length > 0) {
          let body = {
            id: habits[i].id,
            rev: habits[i].rev,
            date: habits[i].log[0].date,
            set: true
          };
          return post('complete-habit', body).then(function (res) {
            assert.deepStrictEqual(res.body.habit.log, habits[i].log);
            /* Get a second log entry in */
            body = {
              id: body.id,
              rev: res.body.habit.rev,
              set: true,
              date: '2017-03-11'
            };
            habits[i].log.push({ amount: habits[i].amount, date: body.date });
            return post('complete-habit', body);
          }).then(function (res) {
            assert.deepStrictEqual(res.body.habit.log, habits[i].log);
          }).catch(function(err) {
            assert(false, 'the request should have succeeded, body:\n' +
              JSON.stringify(body));
          });
        } else { // Tests completing a habit then immediately uncompleting it
          let body = {
            id: habits[i].id,
            rev: habits[i].rev,
            date: '2017-04-09',
            set: true
          };
          return post('complete-habit', body).then(function (res) {
            habits[i].rev = res.body.habit.rev;
            body.set = false;
            body.rev = res.body.habit.rev;
            assert.strictEqual(res.body.habit.log[0].date, '2017-04-09');
            assert.strictEqual(res.body.habit.log[0].amount, habits[i].amount);
            return post('complete-habit', body);
          }).then(function (res) {
            assert.deepStrictEqual(res.body.habit.log, [],
              'there should be no completions for this habit');
          }).catch(function (err) {
            assert(false, 'request should have succeeded, body:\n' +
              JSON.stringify(body) + '\nerror body: ' + err.body);
          });
        }
      });
    }

  });

  describe('Invalid requests to POST /complete-habit', function() {
    let habits = copyHabits(globHabits);
    let invalidBodies = testcases();
    function testcases() {
      return [
        {},
        { id: habits[0].id, rev: habits[0].rev, set: true, date: 'Blah' },
        { id: habits[1].id, rev: habits[0].rev, set: true, date: '2017-04-09' },
        { id: habits[0].id, rev: habits[0].rev, set: true }
      ];
    }
    before(function () {
      return createDB(habits)().then(function (resHabits) {
        habits = resHabits;
        invalidBodies = testcases();
      });
    });
    after(deleteDB);
    for (let i = 0; i < invalidBodies.length; i++) {
      it('should return a bad request error', function() {
        return post('complete-habit', invalidBodies[i]).then(function(res) {
          assert(false, 'request should have failed but succeeded:\n\t'
            + JSON.stringify(res.body));
        }, function (err) {
          assert.strictEqual(err.statusCode, 400);
        });
      });
    };
  });

  describe('Requests to POST /edit-habit', function() {
    let habits = copyHabits(globHabits);
    before(createDB(habits));
    after(deleteDB);

    it('should only edit the habit data', function() {
      let body = {
        id: habits[0].id,
        rev: habits[0].rev,
        name: 'Edited name!',
        amount: 500
      };
      return post('edit-habit', body).then(function (res) {
        assert.strictEqual(res.body.name, body.name);
        assert.strictEqual(res.body.amount, body.amount);
        assert.strictEqual(res.body.id, body.id);
        assert.notStrictEqual(res.body.name, habits[0].name);
        assert.notStrictEqual(res.body.amount, habits[0].amount);
        assert.notStrictEqual(res.body.rev, habits[0].rev);
      }).catch(function (err) {
        assert(false, 'request should have succeeded but failed with err ' +
          err.statusCode);
      });
    });

    it('should only edit the habit data then complete it with the ' +
      'updated data', function() {
        let body = {
          id: habits[1].id,
          rev: habits[1].rev,
          name: 'Edited name!',
          amount: 500
        };
        return post('edit-habit', body).then(function (res) {
          assert.strictEqual(res.body.name, body.name);
          assert.strictEqual(res.body.amount, body.amount);
          assert.strictEqual(res.body.id, body.id);
          assert.notStrictEqual(res.body.name, habits[1].name);
          assert.notStrictEqual(res.body.amount, habits[1].amount);
          assert.notStrictEqual(res.body.rev, habits[1].rev);

          let newAmt = res.body.amount;
          let compDate = '2017-04-09'
          body = {
            id: habits[1].id,
            rev: res.body.rev,
            date: compDate,
            set: true
          };
          return post('complete-habit', body);
        }).then(function (res) {
          assert.notStrictEqual(res.body.habit.rev, body.rev);
          assert.deepStrictEqual(res.body.habit.log, [{amount: 500, date: '2017-04-09'}]);
        }).catch(function (err) {
          assert(false, 'request should have succeeded but failed with err ' +
            err.statusCode);
        });
      }
    );

    it('should complete the habit, edit it, then complete it with the ' +
      'updated data', function() {
        let compDates = ['2017-04-09', '2017-04-10'];
        let newAmount = 500;
        let body = {
          id: habits[2].id,
          rev: habits[2].rev,
          date: compDates[0],
          set: true
        };
        let log = [];
        return post('complete-habit', body).then(function(res) {
          assert.notStrictEqual(res.body.habit.rev, body.rev);
          log.push({amount: habits[2].amount, date: compDates[0]});
          assert.deepStrictEqual(res.body.habit.log, log);
          body = {
            id: habits[2].id,
            rev: res.body.habit.rev,
            name: 'Edited habit, again!',
            amount: newAmount
          };
          return post('edit-habit', body);
        }).then(function (res) {
          assert.notStrictEqual(res.body.rev, body.rev);
          assert.strictEqual(res.body.name, body.name);
          assert.strictEqual(res.body.amount, body.amount);
          body = {
            id: habits[2].id,
            rev: res.body.rev,
            date: compDates[1],
            set: true
          };
          return post('complete-habit', body);
        }).then(function (res) {
          assert.notStrictEqual(res.body.habit.rev, body.rev);
          log.push({amount: newAmount, date: compDates[1]});
          assert.deepStrictEqual(res.body.habit.log, log);
        });
      }
    );

  });

  describe('Invalid requests to POST /edit-habit', function() {
    let habits = copyHabits(globHabits);
    let invalidBodies = testcases();
    /* TODO: Could have a dummy always-passing 'it' test to kick off before and
     * after callbacks */
    before(function() {
      return createDB(habits)().then(function(resHabits) {
        habits = resHabits;
        invalidBodies = testcases();
      });
    });
    after(deleteDB);
    function testcases() {
      return [
        { id: habits[0].id, rev: habits[0].rev },
        { id: habits[1].id, rev: habits[0].rev, name: 'Edited', amount: 200 },
        { id: habits[0].id, rev: habits[0].rev, name: 'Edited', amount: 2.111 },
        { id: habits[0].id, rev: habits[0].rev, name: 'Edited',
          amount: 2.11, superfluous: 'rejcted' },
        { id: habits[0].id, name: 'Edited', amount: 2.1 },
        { rev: habits[0].rev, name: 'Edited', amount: 2.1 }
      ];
    }

    for (let i = 0; i < invalidBodies.length; i++) {
      it('should result in an invalid request error', function() {
        return post('edit-habit', invalidBodies[i]).then(function (res) {
          assert(false, 'the request should have failed');
        }, function(err) {
          assert.strictEqual(err.statusCode, 400);
        });
      });
    }
  });

});
