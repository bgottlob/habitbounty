let loader = module.exports;

const Habit = require('./sharedLibs/habit.js');
const Balance = require('./sharedLibs/balance.js');
const Expense = require('./sharedLibs/expense.js');

let url, dbName;
if (!(url = process.env.COUCH_HOST)) url = 'http://localhost:5984';
if (!(dbName = process.env.HB_DB_NAME)) dbName = 'habitbounty';

let nano = require('nano')(url);
let db = null;
authenticate().then((authedNano) => {
  nano = authedNano;
  return promisify(nano.db.list);
}).then((dbList) => {
  if (dbList.indexOf(dbName) === -1) {
    console.log(dbName + " does not exist, creating it now");
    return promisify(nano.db.create, [dbName]).then((result) => {
      console.log("Created an empty database called " + dbName);
      db = nano.db.use(dbName);
      console.log("Populating the new database with the bare minimum needed" +
        " to run HabitBounty");
      return Promise.all([
        loader.createBalance(new Balance(0)), loader.pushDesignDoc()
      ]);
    });
  }
}).then((result) => {
  db = nano.db.use(dbName);
}).catch((err) => {
  console.log(err);
});

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
            resolve(authNano);
          }
          reject('Could not set cookie!');
        }
      }
    );
  });
}

function promisify(dbCall, args) {
  if (!args) args = [];
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
  } else {
    loader.getDoc('balance').then((doc) => {
      return Promise.resolve('A balance doc exists already, the requested' +
        'balance doc is not being created');
    }).catch((err) => {
      console.log('A balance doc does not exist yet, it is being created now');
      return promisify(db.insert, [balance.toDoc()]);
    });
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

loader.getHabit = function(id) {
  return promisify(db.viewWithList, ['queries', 'all_habits', 'stringify_dates',
    {keys: [id]}]).then(function (result) {
      return Promise.resolve(result[0]);
    });
}

loader.getExpense = function(id) {
  return promisify(db.viewWithList, ['queries', 'all_expenses', 'stringify_dates',
    {keys: [id]}]).then(function (result) {
      return Promise.resolve(result[0]);
    });
}

loader.allHabits = function() {
  return promisify(db.viewWithList,['queries', 'all_habits', 'stringify_dates']);
};

loader.activeHabits = function() {
  return promisify(db.viewWithList,['queries', 'active_habits', 'stringify_dates']);
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
  if (doc.type === 'habit') {
    emit(doc._id,
      { name: doc.name, amount: doc.amount, log: doc.log, rev: doc._rev,
        inactive: doc.inactive }
    );
  }
};

const mapActiveHabits = function(doc) {
  if (doc.type === 'habit' && !doc.inactive) {
    emit(doc._id,
      { name: doc.name, amount: doc.amount, log: doc.log, rev: doc._rev,
        inactive: doc.inactive }
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
  /* TODO: THROW ERROR IF FINAL IS EMPTY */
  //send(req.query.id);
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
    assert(dateArr.length === dateArrLen,
      'date array ' + dateArr + ' must have exactly ' + dateArrLen + ' elements, it has ' + dateArr.length);
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

  function existAssert(values, msg) {
    for (var i = 0; i < values.length; i++)
      assert(typeof(values[i]) !== 'undefined', msg);
  }

  if (newDoc.type === 'habit') {
    existAssert([newDoc.name, newDoc.amount],
      'every habit must have a name and an amount');
    nameAssert(newDoc.name);
    amountAssert(newDoc.amount);
    if (newDoc.log) {
      for (var i = 0; i < newDoc.log.length; i++) {
        existAssert([newDoc.log[i].amount, newDoc.log[i].date],
          'every log entry must have an amount and date array');
        amountAssert(newDoc.log[i].amount);
        dateAssert(newDoc.log[i].date);
      }
    }
  } else if (newDoc.type === 'expense') {
    existAssert([newDoc.name, newDoc.amount],
      'every expense must have a name and an amount');
    nameAssert(newDoc.name);
    amountAssert(newDoc.amount);
    if (newDoc.dateCharged) dateAssert(newDoc.dateCharged);
    else assert(newDoc.dateCharged === null);
  } else if (newDoc.type === 'balance') {
    assert([newDoc.log], 'every balance doc must have a log');
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
    active_habits: {
      map: mapActiveHabits.toString()
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


loader.pushDesignDoc = function() {
  return promisify(db.get, [designDocId]).then(function (doc) {
    /* Design doc exists, get the revision number and push the updated doc */
    designDoc._rev = doc._rev;
    return promisify(db.insert, [designDoc]);
  }).then(function (result) {
    console.log('The design doc ' + '"' + designDocId + '" has been updated!');
  }).catch(function (err) {
    console.log('Error:');
    console.log(err);
    console.log('Attempting to push design doc for the first time');
    return promisify(db.insert, [designDoc]);
  }).then(function (result) {
    console.log(result);
    console.log('The design doc ' + '"' + designDocId + '" has been created!');
  }).catch(function (err) {
    console.log('Could not create design doc, error:\n' + err);
  });
}

loader.deleteDB = function (name) {
  if (!name) name = dbName;
  return promisify(nano.db.destroy, [name]);
}
