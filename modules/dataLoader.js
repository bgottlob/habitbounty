let loader = module.exports;

const Habit = require('./sharedLibs/habit.js');
const Balance = require('./sharedLibs/balance.js');
const Expense = require('./sharedLibs/expense.js');

let url, dbName;
if (!(url = process.env.COUCH_HOST)) url = 'http://localhost:5984';
if (!(dbName = process.env.HB_DB_NAME)) dbName = 'habitbounty';

let nano = require('nano')(url);
let db = nano.db.use(dbName);

function promisify(dbCall, args) {
  return new Promise(function (resolve, reject) {
    dbCall.apply(null, args.concat(function (err, body) {
      if (err) reject(err);
      else resolve(body);
    }));
  });
}

/* TODO: DRY out these create functions */
/* Pushes a Habit object as a new document in the database */
loader.createHabit = function(habit) {
  if (!(habit instanceof Habit)) {
    return Promise.reject({
      error: 'bad_data_type',
      param: habit,
      message: 'The parameter is not an instance of the Habit prototype'
    });
  }
  else {
    return promisify(db.insert, [habit.toDoc()]);
  }
};

loader.createExpense = function(expense) {
  if (!(expense instanceof Expense)) {
    return Promise.reject({
      error: 'bad_data_type',
      param: expense,
      message: 'The parameter is not an instance of the Expense prototype'
    });
  }
  else {
    return promisify(db.insert, [expense.toDoc()]);
  }
};

/* Pushes a Balance object as a new document in the database */
loader.createBalance = function(balance) {
  if (!(balance instanceof Balance)) {
    return Promise.reject({
      error: 'bad_data_type',
      param: balance,
      message: 'The parameter is not an instance of the Balance prototype'
    });
  }
  else {
    return promisify(db.insert, [balance.toDoc()]);
  }
};

/* Assumes the doc object contains the _id and _rev, or else couch will give
 * an error */
loader.updateDoc = function (doc) {
  return promisify(db.insert, [doc]);
};

loader.getDoc = function(docId) {
  return promisify(db.get, [docId]);
};

loader.allHabits = function() {
  return promisify(db.viewWithList,['queries', 'all_habits', 'stringify_dates']);
};

loader.allExpenses = function() {
  return promisify(db.viewWithList,['queries', 'all_expenses', 'stringify_dates']);
};

loader.balance = function () {
  return promisify(db.view, ['queries', 'balance']).then(function (result) {
    return Promise.resolve({ balance: result.rows[0].value });
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

const mapAllHabits = function(doc) {
  if (!doc.inactive && doc.type === 'habit') {
    emit(doc._id,
      { name: doc.name, amount: doc.amount, log: doc.log, rev: doc._rev }
    );
  }
};

const mapAllExpenses = function(doc) {
  if (doc.type === 'expense') {
    emit(doc._id,
      { name: doc.name,
        amount: doc.amount,
        dateCharged: doc.dateCharged,
        rev: doc._rev
      }
    );
  }
};

const mapBalance = function(doc) {
  if (doc.type === 'habit') {
    for (var i = 0; i < doc.log.length; i++)
      emit(doc._id, doc.log[i].amount);
  } else if (doc.type === 'balance') {
    for (var i = 0; i < doc.log.length; i++)
      emit(doc._id, doc.log[i]);
  } else if (doc.type === 'expense') {
    if (doc.dateCharged) emit(doc._id, -(doc.amount));
  }
};

const stringifyDates = function (head, req) {
  function toStr(arr) {
    /* This is time zone agnostic -- the timestamp in this date will be a
     * UTC offset, but it is being stripped out by the split anyway */
    return new Date(arr[0], arr[1] - 1, arr[2]).toISOString().split('T')[0];
  }
  var final = [];
  start({
    'headers': {
      'Content-Type': 'application/json'
    }
  });
  while (row = getRow()) {
    row.value.id = row.id;
    if (row.value.log) {
      for (var i = 0; i < row.value.log.length; i++)
        row.value.log[i].date = toStr(row.value.log[i].date);
    }
    if (row.value.dateCharged) {
      row.value.dateCharged = toStr(row.value.dateCharged);
    }
    final.push(row.value);
  }
  send(toJSON(final));
};

const validation = function (newDoc, oldDoc, userCtx) {
  function assert(condition, msg) {
    if (!condition) throw({forbidden: msg});
  }

  function amountAssert(amt) {
    var digsAfterDec = 2;
    assert(amt.toFixed(digsAfterDec) == amt,
      'amount ' + amt + ' must be no more precise than ' +
      digsAfterDec + ' digits after the decimal');
  }

  function dateAssert(dateArr) {
    function areSame(arr, match) {
      var res = true;
      for (var i = 0; res && i < arr.length; i++)
        res = res && (arr[i] === Number(match[i+1]));
      return res;
    }
    var dateArrLen = 3;
    assert(dateArr.length !== dateArrLen,
      'date array must have exactly ' + dateArrLen + ' elements');
    var dateStr = new Date(dateArr[0], dateArr[1]-1, dateArr[2]).toISOString();
    var match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T.*/);
    assert(match && areSame(dateArr, match),
      'date array provided does not represent a valid date');
  }


  function nameAssert(name) {
    var maxNameLen = 140;
    assert(name.length <= maxNameLen,
      'name must be no more than ' + maxNameLen + ' characters long');
  }

  if (newDoc.type === 'habit') {
    assert(newDoc.name && newDoc.amount, 'every habit must have at least a name and amount');
    nameAssert(newDoc.name);
    amountAssert(newDoc.amount);
    if (newDoc.log) {
      for (var i = 0; i < newDoc.log.length; i++) {
        assert(newDoc.date && newDoc.amount, 'every log entry must have a date and amount');
        amountAssert(newDoc.log[i].amount);
        dateAssert(newDoc.log[i].date);
      }
    }
  } else if (newDoc.type === 'expense') {
    assert(newDoc.name && newDoc.amount, 'every expense must have at least a name and amount');
    if (newDoc.dateCharged) dateAssert(newDoc.dateCharged);
    else assert(newDoc.dateCharged === null);
  } else if (newDoc.type === 'balance') {
    assert(newDoc.log, 'every balance doc must have a log');
    for (var i = 0; i < newDoc.log.length; i++)
      amountAssert(newDoc.log[i]);
  } else {
    throw({forbidden: newDoc.type + ' is not a valid doc type'});
  }

};

let designDocId = '_design/queries';
let designDoc = {
  _id: designDocId,
  views: {
    all_habits: {
      map: mapAllHabits.toString()
    },
    all_expenses: {
      map: mapAllExpenses.toString()
    },
    balance: {
      map: mapBalance.toString(),
      reduce: '_sum'
    }
  },
  lists: {
    stringify_dates: stringifyDates.toString()
  },
  validate_doc_update: validation.toString()
};

function authenticate() {
  return new Promise(function (resolve, reject) {
    nano.auth(process.env.COUCH_USER, process.env.COUCH_PASS,
      function (err, body, headers) {
        if (err) reject(err);
        else {
          if (headers && headers['set-cookie']) {
            let authNano = require('nano')({
              url: url,
              cookie: headers['set-cookie']
            });
            resolve(authNano.db.use(dbName));
          }
          reject('Could not set cookie!');
        }
      }
    );
  });
}

loader.pushDesignDoc = function() {
  return authenticate().then(function (authdb) {
    console.log(designDocId);
    return promisify(authdb.get, [designDocId]).then(function (doc) {
      /* Design doc exists, get the revision number and push the updated doc */
      designDoc._rev = doc._rev;
      return promisify(authdb.insert, [designDoc]);
    }).then(function (result) {
      console.log('The design doc ' + '"' + designDocId + '" has been updated!');
    }).catch(function (err) {
      console.log('Error:');
      console.log(err);
      console.log('Attempting to push design doc for the first time');
      return promisify(authdb.insert, [designDoc]);
    }).then(function (result) {
      console.log(result);
      console.log('The design doc ' + '"' + designDocId + '" has been created!');
    }).catch(function (err) {
      console.log('Could not create design doc, error:\n' + err);
    });
  }).catch(function (err) {
    console.log('Could not authenticate');
    console.log(err);
  });
}
