let loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./sharedLibs/habit.js');
const Balance = require('./sharedLibs/balance.js');
const Expense = require('./sharedLibs/expense.js');

let url, dbName;
if (!(url = process.env.COUCH_HOST)) url = 'http://localhost:5984';
if (!(dbName = process.env.HB_DB_NAME)) dbName = 'habitbounty';
let db = new PouchDB(url + '/' + dbName, {
  auth: {
    username: process.env.COUCH_USER,
    password: process.env.COUCH_PASS
  }
});

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
    return db.post(habit.toDoc());
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
    return db.post(expense.toDoc());
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
    return db.put(balance.toDoc());
  }
};

/* Assumes the doc object contains the _id and _rev, or else couch will give
 * an error */
loader.updateDoc = function (doc) {
  return db.put(doc);
};

/* Assumes the doc object contains the _id and _rev, or else couch will give
 * an error */
loader.deleteDoc = function(doc) {
  return db.remove(doc);
};

loader.getDoc = function(docId) {
  return db.get(docId);
};

const nano = require('nano')('http://localhost:5984');
const nanodb = nano.db.use(dbName);

loader.allHabits = function() {
  return new Promise(function (resolve, reject) {
    nanodb.viewWithList('queries', 'all_habits', 'stringify_dates', function (err, body) {
      if (err) return reject(err);
      else return resolve(body);
    });
  });
};

loader.allExpenses = function() {
  return new Promise(function (resolve, reject) {
    nanodb.viewWithList('queries', 'all_expenses', 'stringify_dates', function (err, body) {
      if (err) return reject(err);
      else return resolve(body);
    });
  });
};

loader.balance = function () {
  return db.query('queries/balance', {reduce: true}).then(function (result) {
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

loader.pushDesignDoc = function() {
  return db.get(designDocId).then(function (doc) {
    /* Design doc exists, get the revision number and push the updated doc */
    designDoc._rev = doc._rev;
    return db.put(designDoc);
  }).then(function (result) {
    console.log('The design doc ' + '"' + designDocId + '" has been updated!');
  }).catch(function (err) {
    console.log('Error:');
    console.log(err);
    console.log('Attempting to push design doc for the first time');
    return db.put(designDoc);
  }).then(function (result) {
    console.log(result);
    console.log('The design doc ' + '"' + designDocId + '" has been created!');
  }).catch(function (err) {
    console.log('Could not create design doc, error:\n' + err);
  });
}

loader.migrationIncMonths = function() {
  function modifyDoc(doc) {
    if (doc.type === 'habit' && doc.log) {
      for (var i = 0; i < doc.log.length; i++)
        doc.log[i].date[1] = doc.log[i].date[1] + 1;
    } else if (doc.type === 'expense') {
      if (doc.dateCharged) doc.dateCharged[1] = doc.dateCharged[1] + 1;
    }
    return doc;
  }

  throw "Comment out this throw if you REALLY want to run this migration. It will increment all months in dateCharged for expense docs and do the same for each date within the log of each habit doc."
  db.allDocs({include_docs: true}).then(function (result) {
    result.rows.forEach(function(row) {
      console.log('Modifying ' + row.id);
      console.log(row.doc);
      if (doc.type === 'habit' || doc.type === 'expense') {
        db.put(modifyDoc(row.doc)).then(function(res) {
          console.log('Modified ' + row.id);
        }).catch(function(err) {
          console.log('Could not modify ' + row.key);
          console.log(err);
        });
      }
    });
  }).catch(function(err) {
    console.log('Could not query view');
    console.log(err);
  });
};

loader.migrationRemoveReward = function() {
  function modifyDoc(doc) {
    if (doc.type === 'habit') {
      if (doc.reward) {
        doc.amount = doc.reward;
        delete doc.reward;
      }
      if (doc.log) {
        for (var i = 0; i < doc.log.length; i++) {
          if (doc.log[i].reward) {
            doc.log[i].amount = doc.log[i].reward;
            delete doc.log[i].reward;
          }
        }
      }
    }
    return doc;
  }

  throw "Comment out this throw if you REALLY want to run this migration. It will change the 'reward' elements to be named 'amount' in all habit docs."
  db.allDocs({include_docs: true}).then(function (result) {
    result.rows.forEach(function (row) {
      console.log('Modifying ' + row.id);
      db.put(modifyDoc(row.doc)).then(function (res) {
        console.log('Modified ' + row.id);
      }).catch(function (err) {
        console.log('Could not modify ' + row.key);
        console.log(err);
      });
    });
  }).catch(function (err) {
    console.log(err);
  });
}
