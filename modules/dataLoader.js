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

loader.allHabits = function() {
  return db.query('queries/all_habits').then(function (result) {
    resList = [];
    result.rows.forEach(function (row) {
      let habit = new Habit(row.value.name, row.value.reward, row.value.log);
      habit.id = row.id;
      habit.rev = row.value.rev;
      resList.push(habit);
    });
    return Promise.resolve(resList);
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

loader.allExpenses = function() {
  return db.query('queries/all_expenses').then(function (result) {
    resList = [];
    result.rows.forEach(function (row) {
      let expense = new Expense(row.value.name, row.value.amount,
                                row.value.dateCharged);
      expense.id = row.id;
      expense.rev = row.value.rev;
      resList.push(expense);
    });
    return Promise.resolve(resList);
  }).catch(function (err) {
    return Promise.reject(err);
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
      { name: doc.name, reward: doc.reward, log: doc.log, rev: doc._rev }
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
      emit(doc._id, doc.log[i].reward);
  } else if (doc.type === 'balance') {
    for (var i = 0; i < doc.log.length; i++)
      emit(doc._id, doc.log[i]);
  } else if (doc.type === 'expense') {
    if (doc.dateCharged) emit(doc._id, -(doc.amount));
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
  }
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
