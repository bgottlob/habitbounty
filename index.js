const http = require('http');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const ecstatic =  require('ecstatic');
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/sharedLibs/habit.js');
const Balance = require('./modules/sharedLibs/balance.js');
const Expense = require('./modules/sharedLibs/expense.js');
require('./modules/sharedLibs/sharedLib.js');

let router = new Router();
let fileServer = ecstatic({root: __dirname + '/public'});

/* For serving files that come from node modules */
let nodeModServer = ecstatic({root: __dirname + '/node_modules'});

/* For serving files that are shared between server and client code */
let sharedLibServer = ecstatic({root: __dirname + '/modules/sharedLibs'});

/* Compile and serve the client for the home page, a list of all habits
 * in the system */
router.add('GET', /^\/$/, function (request, response) {
  request.url = '/index.html';
  fileServer(request, response);
});

router.add('GET', /^\/docs$/, function (request, response) {
  request.url = '/hb_swagger.json';
  request.url = '/hb_swagger_new.json';
  response.setHeader('Access-Control-Allow-Methods',
    'DELETE, POST, GET, OPTIONS, PUT');
  response.setHeader('Access-Control-Allow-Origin', '*');
  fileServer(request, response);
});

/* Serve a file from an npm module to the client */
router.add('GET', /^\/lib\/(.+)$/, function (request, response, filename) {
  /* Mapping of file names to their path relative to /node_modules */
  nodeModFiles = {
    'handlebars.min.js': '/handlebars/dist/handlebars.min.js',
    'milligram.min.css': '/milligram/dist/milligram.min.css',
    'normalize.css': '/normalize.css/normalize.css',
    'milligram.min.css.map': '/milligram/dist/milligram.min.css.map'
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
  response.setHeader('Content-Type', 'application/json');
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

/* Return a list of all expenses in JSON for any client to consume */
router.add('GET', /^\/all-expenses$/, function (request, response) {
  simpleGET(loader.allExpenses(), response);
});

/* Get the info for a single habit given the habit's document id */
router.add('GET', /^\/habit\/(\w+)$/, function (request, response, docId) {
  simpleGET(loader.getHabit(docId), response);
});

/* Get the info for the balance */
router.add('GET', /^\/balance$/, function (request, response) {
  simpleGET(loader.balance(), response);
});

/* Completes a habit: Adds the provided date array to the habit's log and
 * changes the balance appropriately */
router.add('POST', /^\/complete-habit$/, function (request, response) {
  const habitId = request.body.id;
  const habitRev = request.body.rev;
  const dateStr = request.body.date;
  const set = request.body.set;
  loader.getDoc(habitId).then(function (doc) {
    /* TODO: create a habit from couch document function */
    let habit = new Habit(doc.name, doc.amount,
      doc.log.map(function (entry) {
        return {
          amount: entry.amount,
          date: entry.date.dateToStr()
        };
      })
    );

    if (set) habit.complete(dateStr);
    else habit.uncomplete(dateStr);

    var habitDelta = habit.toDoc();
    habitDelta._rev = habitRev;
    return loader.updateDoc(Object.assign(doc, habitDelta));
  }).then(function (result) {
    /* Get latest updates to the habit doc and balance */
    return Promise.all([loader.getHabit(habitId), loader.balance()]);
  }).then(function (docs) {
    return response.end(JSON.stringify({
      habit: docs[0],
      balance: docs[1].balance
    }));
  }).catch(function (err) {
    console.log(err);
    response.statusCode = 400;
    return response.end(JSON.stringify(err));
  });
});

router.add('POST', /^\/charge-expense$/, function (request, response) {
  const id = request.body.id;
  const rev = request.body.rev;
  const dateArray = request.body.dateCharged;
  loader.getDoc(id).then(function (doc) {
    let initDateCharged = null;
    if (doc.dateCharged) initDateCharged = doc.dateCharged.dateToStr();
    let expense = new Expense(doc.name, doc.amount, initDateCharged);
    if (dateArray) expense.charge(dateArray);
    else expense.uncharge();
    let delta = expense.toDoc();
    delta._rev = rev;
    return loader.updateDoc(Object.assign(doc, delta));
  }).then(function(result) {
    /* Get latest updates */
    return Promise.all([loader.getExpense(id), loader.balance()]);
  }).then(function(result) {
    return response.end(JSON.stringify({
      expense: result[0],
      balance: result[1].balance
    }));
  }).catch(function(err) {
    console.log(err);
    response.statusCode = 400;
    return response.end(JSON.stringify(err));
  });
});

router.add('POST', /^\/change-balance$/, function (request, response) {
  const changeAmt = Number(request.body.amount);
  loader.getDoc('balance').then(function (doc) {
    let balance = new Balance(doc.log);
    balance.changeAmountBy(changeAmt);
    return loader.updateDoc(Object.assign(doc, balance.toDoc()));
  }).then(function (result) {
    return loader.balance();
  }).then(function (result) {
    return response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    return response.end(JSON.stringify(err));
  });
});

/* Update basic info about a habit -- but not the log -- never trust the client
 * Ignores everything in the request body except for the name and amount */
router.add('POST', /^\/edit-habit$/, function (request, response) {
  const docId = request.body.id;
  loader.getHabit(docId).then(function(doc) {
    let habit = new Habit(doc.name, doc.amount, doc.log);
    let delta = { _rev: request.body.rev, _id: docId };
    if (request.body.name) delta.name = request.body.name;
    if (request.body.amount) delta.name = request.body.amount;
    /* If delta data went into the Habit constructor, the habit's log would
     * be cleared; we don't want that */
    return loader.updateDoc(Object.assign(habit.toDoc(), delta));
  }).then(function (result) {
    /* Document successfully updated; now get the updated doc and send it
     * back to the client */
    return loader.getHabit(docId);
  }).then(function (doc) {
    response.end(JSON.stringify(doc));
  }).catch(function (err) {
    console.log(err);
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

router.add('DELETE', /^\/habit$/, function (request, response) {
  const docId = request.body.id;
  loader.getDoc(docId).then(function (doc) {
    let habit = new Habit(doc.name, doc.amount, doc.log);
    delta = { _rev: request.body.rev, inactive: true, _id: request.body.id };
    return loader.updateDoc(Object.assign(habit.toDoc(), delta));
  }).then(function (result) {
    return loader.getHabit(docId);
  }).then(function (result) {
    response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

/* TODO: DRY out these create routes */
/* Creates a new habit */
router.add('PUT', /^\/habit$/, function (request, response) {
  const habit = new Habit(request.body.name, request.body.amount);
  loader.createHabit(habit).then(function(result) {
    return loader.getHabit(result.id);
  }).then(function (result) {
    response.statusCode = 200;
    response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

/* Creates a new expense */
router.add('PUT', /^\/expense$/, function (request, response) {
  const expense = new Expense(request.body.name, request.body.amount);
  loader.createExpense(expense).then(function(result) {
    return loader.getExpense(result.id);
  }).then(function (result) {
    response.statusCode = 200;
    response.end(JSON.stringify(result));
  }).catch(function (err) {
    response.statusCode = 400;
    response.end(JSON.stringify(err));
  });
});

http.createServer(function (request, response) {
  let body = [];
  /*
  response.setHeader('Access-Control-Allow-Methods',
    'DELETE, POST, GET, OPTIONS, PUT');
  response.setHeader('Access-Control-Allow-Origin', '*');
  */
  request.on('data', function (chunk) {
    /* Build body of request based on incoming data chunks */
    body.push(chunk);
  }).on('end', function () {
    /* When there are no more data chunks, turn data into a string
     * and set to the request body property */
    if (body.length > 0) {
      body = Buffer.concat(body).toString();
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
