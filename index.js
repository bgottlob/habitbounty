const http = require('http');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/sharedLibs/habit.js');
const Balance = require('./modules/sharedLibs/balance.js');

var router = new Router();
var fileServer = ecstatic({root: __dirname + '/public'});

/* For serving files that come from node modules */
var nodeModServer = ecstatic({root: __dirname + '/node_modules'});

/* For serving files that are shared between server and client code */
var sharedLibServer = ecstatic({root: __dirname + '/modules/sharedLibs'});

/* Compile and serve the client for the home page, a list of all habits
 * in the system */
router.add('GET', /^\/$/, (request, response) => {
  request.url = '/index.html';
  fileServer(request, response);
});

/* Serve a file from an npm module to the client */
router.add('GET', /^\/lib\/(.+)$/, function (request, response, filename) {
  /* Mapping of file names to their path relative to /node_modules */
  nodeModFiles = {
    'handlebars.min.js': '/handlebars/dist/handlebars.min.js',
    'milligram.min.css': '/milligram/dist/milligram.min.css',
    'normalize.css': '/normalize.css/normalize.css'
  };
  request.url = nodeModFiles[filename];
  if (!request.url) {
    response.statusCode = 404;
    response.end('File not found!');
  } else
    nodeModServer(request, response);
});

/* Serve a file that is shared by both client and server code filenames sent
 * to this route must be relative to /modules/sharedLibs */
router.add('GET', /^\/shared-lib\/(.+)$/, function (request, response, filename) {
  request.url = '/' + filename;
  sharedLibServer(request, response);
});

function simpleGET(loaderPromise, response) {
  loaderPromise.then(function (results) {
    response.end(JSON.stringify(results));
  }).catch(function (err) {
    response.statusCode = 404;
    response.end(JSON.stringify(err));
  });
}

/* Return a list of all habits in JSON for any client to consume */
router.add('GET', /^\/all-habits$/, function (request, response) {
  simpleGET(loader.allHabits(), response);
});

/* Get the info for a single habit given the habit's document id */
router.add('GET', /^\/habit\/(\w+)/, function (request, response, docId) {
  simpleGET(loader.getDoc(docId), response);
});

/* Get the info for the balance */
router.add('GET', /^\/balance/, function (request, response) {
  simpleGET(loader.getDoc('balance'), response);
});

/* Completes a habit: Adds the provided date array to the habit's log and
 * changes the balance appropriately */
router.add('POST', /^\/complete-habit$/, (request, response) => {
  const habitId = request.body.id;
  const dateArray = request.body.date;
  const set = request.body.set;
  Promise.all([loader.getDoc(habitId), loader.getDoc('balance')])
    .then(function (docs) {
      var habit = new Habit(docs[0].name, docs[0].reward, docs[0].log);
      var balance = new Balance(docs[1].amount);
      /* (Un)complete the habit and modify the balance */
      if (set) {
        habit.complete(dateArray);
        balance.changeAmountBy(habit.reward);
      } else {
        habit.uncomplete(dateArray);
        balance.changeAmountBy(-(habit.reward));
      }
      /* Push updates to the database */
      return Promise.all([
        loader.updateDoc(Object.assign(docs[0], habit.toDoc())),
        loader.updateDoc(Object.assign(docs[1], balance.toDoc()))
      ]);
    }).then(function (results) {
      /* Both documents were successfully udpated, get the updated
       * versions of them to prepare response */
      return Promise.all([loader.getDoc(habitId), loader.getDoc('balance')]);
    }).then(function (docs) {
      var habit = new Habit(docs[0].name, docs[0].reward, docs[0].log);
      var balance = new Balance(docs[1].amount);
      return response.end(JSON.stringify({
        completed: habit.isComplete(dateArray),
        newBalance: balance.amount
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
});

router.add('POST', /^\/change-balance$/, (request, response) => {
  const changeAmt = request.body.changeAmt;
  loader.getDoc('balance').then(function (doc) {
    var balance = new Balance(doc.amount);
    balance.changeAmountBy(changeAmt);
    return loader.updateDoc(Object.assign(doc, balance.toDoc()));
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
  loader.getDoc(docId).then(function(doc) {
    var habitDelta = new Habit(request.body.name, request.body.reward);
    return loader.updateDoc(Object.assign(doc, habitDelta.toDoc()));
  }).then(function (result) {
    response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

/* Creates a new habit */
router.add('PUT', /^\/habit$/, function (request, response) {
  const habit = new Habit(request.body.name, request.body.reward);
  loader.createHabit(habit).then(function(result) {
    response.statusCode = 200;
    response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

http.createServer(function(request, response) {
  var body = [];
  request.on('data', function (chunk) {
    /* Build body of request based on incoming data chunks */
    body.push(chunk);
  }).on('end', function () {
    /* When there are no more data chunks, turn data into a string
     * and set to the request body property */
    if (body.length > 0) {
      body = Buffer.concat(body).toString();
      /* TODO: Catch error - server dies if JSON doesn't parse */
      try {
        request.body = JSON.parse(body);
      } catch (e) {
        console.log('This body could not be parsed into JSON:\n' + body);
        request.body = {};
      }
    }
    /* Hand request off to the router */
    if (!router.resolve(request, response)) {
      fileServer(request, response);
    }
  });
}).listen(Number(process.argv[2]));
