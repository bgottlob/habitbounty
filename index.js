const http = require('http');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/habit.js');
const Balance = require('./modules/balance.js');

var router = new Router();
var fileServer = ecstatic({root: __dirname + '/public'});

/* For serving files that come from node modules */
var libServer = ecstatic({root: __dirname + '/node_modules'});

/* Compile and serve the HTML for the home page, a list of all habits
 * in the system */
router.add('GET', /^\/$/, (request, response) => {
  request.url = '/index.html';
  fileServer(request, response);
});

router.add('GET', /^\/lib\/(.+)$/, function (request, response, filename) {
  filenameMap = {
    'handlebars.min.js': '/handlebars/dist/handlebars.min.js',
    'milligram.min.css': '/milligram/dist/milligram.min.css',
    'normalize.css': '/normalize.css/normalize.css'
  };
  request.url = filenameMap[filename];
  /* TODO: send a file not found error directly to browser, don't put into the
   * library file server */
  if (!request.url) request.url = 'notafile';
  libServer(request, response);
});

/* Return a list of all habits in JSON for any client to consume */
router.add('GET', /^\/all-habits$/, (request, response) => {
  loader.allHabits((err, results) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else {
      response.end(JSON.stringify(results));
    }
  });
});

router.add('GET', /^\/habit\/(\w+)/, (request, response, docId) => {
  loader.getHabit(docId).then(function (doc) {
    response.end(JSON.stringify(doc));
  }).catch(function (err) {
    response.statusCode = 404;
    response.end(JSON.stringify(err));
  });
});

router.add('GET', /^\/balance/, (request, response) => {
  console.log('getting balance');
  loader.getHabit('balance').then(function (doc) {
    console.log(doc);
    response.end(JSON.stringify(doc));
  }).catch(function (err) {
    response.statusCode = 404;
    response.end(JSON.stringify(err));
  });
});

/* Route: /complete-habit
 * Body (to complete habits on Jan 20, 2017:
 * [
 *   { "id": "<couch_id>", "date": [2017, 0, 20], "set": "true" },
 *   ...
 *   { "id": "<couch_id>", "date": [2017, 0, 20], "set": "false" }
 * ]
 */
router.add('POST', /^\/complete-habit$/, (request, response) => {
  const docId = request.body.id;
  const dateArray = request.body.date;
  const set = request.body.set;
  loader.getHabit(docId).then(function (doc) {
    var habit = new Habit(doc.name, doc.reward, doc.log);
    if (set)
      habit.complete(dateArray);
    else
      habit.uncomplete(dateArray);
    return Promise.resolve(Object.assign(doc, habit.toDoc()));
  }).then(function (doc) {
    return loader.updateHabit(doc);
  }).then(function (result) {
    return response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    return response.end(JSON.stringify(err));
  });
});

router.add('POST', /^\/change-balance$/, (request, response) => {
  const changeAmt = request.body.changeAmt;
  console.log('Changing balance by ' + changeAmt);
  loader.getDoc('balance').then(function (doc) {
    var balance = new Balance(doc.amount);
    balance.changeAmountBy(changeAmt);
    return Promise.resolve(Object.assign(doc, balance.toDoc()));
  }).then(function (doc) {
    return loader.updateDoc(doc);
  }).then(function (result) {
    return response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    return response.end(JSON.stringify(err));
  });
});

/* Update basic info about a habit -- but not the log -- never trust the client
 * Ignores everything in the request body except for the name and reward */
router.add('POST', /^\/info-habit\/(\w+)/, (request, response, docId) => {
  loader.getHabit(docId, (err, doc) => {
    if (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    } else {
      /* TODO: Coerce the types of the body arguments to check for potential
       * errors there; also check if the arguments exist */
      /* TODO: Maybe just always pass these arguments to the Habit constructor
       * so that the Habit prototype can handle santization of the data */
      const updatedDoc = Object.assign(doc, {
        name: String(request.body.name),
        reward: Number(request.body.reward)
      });
      loader.updateHabit(updatedDoc, (err, result) => {
        if (err) {
          response.statusCode = 400;
          response.end(JSON.stringify(err));
        }
        else response.end(JSON.stringify(result));
      });
    }
  });
});

router.add('PUT', /^\/habit$/, (request, response) => {
  /* TODO: Catch potential issue -- name and reward must be present in
   * request -- maybe even find spurious attributes in JSON */
  var err = null;
  missing = [];
  if (!request.body.name)
    missing.push("name");
  if (!request.body.reward)
    missing.push("reward");

  if (missing.length > 0) {
    response.statusCode = 400;
    response.end(JSON.stringify({
      message: 'missing attribute(s) ' + missing.join(',')
    }));
  } else if (isNaN(request.body.reward)) {
    response.statusCode = 400;
    response.end(JSON.stringify({
      message: 'reward is not a number'
    }));
  } else {
    const habit = new Habit(request.body.name, request.body.reward);
    loader.createHabit(habit, (err, result) => {
      if (err) {
        response.statusCode = 400;
        response.end(JSON.stringify(err));
      } else {
        response.statusCode = 200;
        /* TODO: Make the result a JSON string */
        response.end(JSON.stringify(result));
      }
    });
  }
});

http.createServer(function(request, response) {
  var body = [];
  request.on('data', (chunk) => {
    /* Build body of request based on incoming data chunks */
    body.push(chunk);
  }).on('end', () => {
    /* When there are no more data chunks, turn data into a string
     * and set to the request body property */
    if (body.length > 0) {
      body = Buffer.concat(body).toString();
      /* TODO: Catch error - server dies if JSON doesn't parse */
      request.body = JSON.parse(body);
    }
    /* Hand request off to the router */
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(8080);
