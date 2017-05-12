const http = require('http');
const ecstatic =  require('ecstatic');
const loader = require('./modules/dataLoader.js');
const Router = require('./modules/router.js')
const templateHandler = require('./modules/templateHandler.js');
const Habit = require('./modules/sharedLibs/habit.js');
const Balance = require('./modules/sharedLibs/balance.js');
const Expense = require('./modules/sharedLibs/expense.js');
const Chore = require('./modules/sharedLibs/chore.js');
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
  /* Necesary headers for use with Swagger UI */
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

function respondBadReq(response, reason) {
  response.statusCode = 400;
  response.end(reason);
}

function validateRequest(body, required, optional, moreFunc) {

  let invalidMsg = '';

  let all = [];
  if (required) all = all.concat(required);
  if (optional) all = all.concat(optional);

  let missing = required.filter((field) => {
    return typeof(body[field]) === 'undefined';
  });
  if (missing.length > 0)
    invalidMsg += 'the following fields are required in the request: ' + missing.join(', ') + '. ';

  let extras = Object.keys(body).filter((field) => {
    return all.indexOf(field) === -1
  });
  if (extras.length > 0)
    invalidMsg += 'the following fields are not allowed in the request: ' + extras.join(', ') + '. ';

  if (moreFunc) {
    moreMsg = moreFunc(body);
    if (moreMsg) invalidMsg += moreMsg;
  }

  if (invalidMsg === '') return false;
  else return invalidMsg;
}

/* Return a list of all habits in JSON for any client to consume */
router.add('GET', /^\/all-habits$/, function (request, response) {
  simpleGET(loader.allHabits(), response);
});

router.add('GET', /^\/all-chores$/, function (request, response) {
  simpleGET(loader.allChores(), response);
});

/* Return a list of active habits in JSON for any client to consume */
router.add('GET', /^\/active-habits$/, function (request, response) {
  simpleGET(loader.activeHabits(), response);
});

/* Return a list of active habits in JSON for any client to consume */
router.add('GET', /^\/archived-habits$/, function (request, response) {
  simpleGET(loader.archivedHabits(), response);
});

/* Return a list of all expenses in JSON for any client to consume */
router.add('GET', /^\/all-expenses$/, function (request, response) {
  simpleGET(loader.allExpenses(), response);
});

router.add('GET', /^\/habits-left\/(\d{4}-\d{2}-\d{2})$/,
  (request, response, dateStr) => {
    /* TODO: Verify the date string */
    simpleGET(loader.habitsLeft(dateStr), response);
  }
);

/* Get the info for a single habit given the habit's document id */
router.add('GET', /^\/habit\/(\w+)$/, function (request, response, id) {
  if (!id) respondBadReq(response, 'request must contain habit ID in path');
  else simpleGET(loader.getHabit(id), response);
});

router.add('GET', /^\/chore\/(\w+)$/, function (request, response, id) {
  if (!id) respondBadReq(response, 'request must contain chore ID in path');
  else simpleGET(loader.getChore(id), response);
});

/* Get the info for the balance */
router.add('GET', /^\/balance$/, function (request, response) {
  simpleGET(loader.balance(), response);
});

/* Completes a habit: Adds the provided date array to the habit's log and
 * changes the balance appropriately */
router.add('POST', /^\/complete-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'date', 'set']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let habit = Habit.fromDoc(origDoc);
      if (body.set) habit.complete(body.date);
      else habit.uncomplete(body.date);
      return Object.assign(origDoc, habit.toDoc());
    }).then(function (result) {
      /* Get latest updates to the habit doc and balance */
      return Promise.all([loader.getHabit(body.id), loader.balance()]);
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
  }
});

router.add('POST', /^\/charge-expense$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'dateCharged']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let expense = Expense.fromDoc(origDoc);
      if (body.dateCharged) expense.charge(body.dateCharged);
      else expense.uncharge();
      return Object.assign(origDoc, expense.toDoc());
    }).then(function(result) {
      /* Get latest updates */
      return Promise.all([loader.getExpense(body.id), loader.balance()]);
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
  }
});

/* TODO: FIX THIS -- A REV MUST BE USED HERE TO CONTROL CONCURRENCY */
router.add('POST', /^\/change-balance$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['amount'], null, (b) => {
    if (isNaN(b.amount)) return 'amount must be a valid number';
  });
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.getDoc('balance').then(function (doc) {
      const changeAmt = Number(body.amount);
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
  }
});

/* Update basic info about a habit -- but not the log -- never trust the client
 * Ignores everything in the request body except for the name and amount */
router.add('POST', /^\/edit-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev'], ['name', 'amount'],
    (b) => {
      if (typeof(b.name) === 'undefined' && typeof(b.amount) === 'undefined')
        return 'either name, amount, or both must be provided';
    }
  );
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let habit = Habit.fromDoc(origDoc);
      if (body.name) habit.name = body.name;
      if (body.amount) habit.amount = body.amount;
      return Object.assign(origDoc, habit.toDoc());
    }).then(function (result) {
      return loader.getHabit(body.id);
    }).then(function (doc) {
      response.end(JSON.stringify(doc));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/edit-expense/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev'], ['name', 'amount'],
    (b) => {
      if (typeof(b.name) === 'undefined' && typeof(b.amount) === 'undefined')
        return 'either name, amount, or both must be provided';
    }
  );
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let expense = Expense.fromDoc(origDoc)
      if (body.name) expense.name = body.name;
      if (body.amount) expense.amount = body.amount;
      return Object.assign(origDoc, expense.toDoc());
    }).then(function (result) {
      /* This request can change the balance if the expense was completed and
       * its amount changed */
      return Promise.all([loader.getExpense(body.id), loader.balance()]);
    }).then(function (docs) {
      response.end(JSON.stringify({
        expense: docs[0],
        balance: docs[1]
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/archive-habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'archived']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      return Object.assign(origDoc, { archived: body.archived });
    }).then(function (result) {
      return loader.getHabit(body.id);
    }).then(function (result) {
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

/* TODO: DRY out these create routes */
/* Creates a new habit */
router.add('PUT', /^\/habit$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const habit = new Habit(body.name, body.amount);
    loader.createHabit(habit).then(function(result) {
      return loader.getHabit(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

router.add('PUT', /^\/chore$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const chore = new Chore(body.name, body.amount);
    loader.createChore(chore).then(function(result) {
      return loader.getChore(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

/* Creates a new expense */
router.add('PUT', /^\/expense$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const expense = new Expense(body.name, body.amount);
    loader.createExpense(expense).then(function(result) {
      return loader.getExpense(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

http.createServer(function (request, response) {
  let body = [];
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
