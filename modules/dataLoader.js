let loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./sharedLibs/habit.js');
const Balance = require('./sharedLibs/balance.js');

const url = 'http://localhost';
const port = 5984;
let db = new PouchDB(url + ':' + port + '/habitbounty', {
  auth: {
    username: process.env.COUCH_USER,
    password: process.env.COUCH_PASS
  }
});

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
    return db.post(habit.toDoc()).then(function(result) {
      return Promise.resolve(result);
    }).catch(function (err) {
      return Promise.reject(err);
    });
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
    return db.put(balance.toDoc()).then(function (result) {
      return Promise.resolve(result);
    }).catch(function (err) {
      return Promise.reject(err)
    });
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

const mapBalance = function(doc) {
  if (doc.type === 'habit') {
    for (var i = 0; i < doc.log.length; i++)
      emit(doc._id, doc.log[i].reward);
  } else if (doc.type === 'balance') {
    for (var i = 0; i < doc.log.length; i++)
      emit(doc._id, doc.log[i]);
  }
};

let designDocId = '_design/queries';
let designDoc = {
  _id: designDocId,
  views: {
    all_habits: {
      map: mapAllHabits.toString()
    },
    balance: {
      map: mapBalance.toString(),
      reduce: '_sum'
    }
  }
};

pushDesignDoc();

function pushDesignDoc() {
  db.get(designDocId).then(function (doc) {
    /* Design doc exists, get the revision number and push the updated doc */
    designDoc._rev = doc._rev;
    return db.put(designDoc);
  }).then(function (result) {
    console.log('The design doc ' + '"' + designDocId + '" has been created/updated!');
  }).catch(function (err) {
    console.log(err);
  });
}
