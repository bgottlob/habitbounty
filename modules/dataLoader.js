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
  /* TODO: I'm pretty sure this extra layer of calls with resolve and reject
   * is pointless. Test without it and update it anywhere else in this module */
  return db.put(doc).then(function (result) {
    return Promise.resolve(result);
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

/* Assumes the doc object contains the _id and _rev, or else couch will give
 * an error */
loader.deleteDoc = function(doc) {
  return db.remove(doc).then(function (result) {
    return Promise.resolve(result);
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

loader.getDoc = function(docId) {
  return db.get(docId).then(function (doc) {
    return Promise.resolve(doc);
  }).catch(function (err) {
    return Promise.reject(err);
  });
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
    return Promise.resolve({ amount: result.rows[0].value });
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

/* TODO: It appears that control flow is correct here, but look up the
 * general consensus on performing such a flow */
function pushDesignDoc() {
  db.get(designDocId).then(function (doc) {
    /* Design doc exists, get the revision number and push the updated doc */
    designDoc._rev = doc._rev;
    return db.put(designDoc);
  }).then(function (result) {
    console.log('The design doc ' + '"' + designDocId + '" has been updated!');
  }).catch(function (err) {
    if (err.error === 'not_found') {
      /* Design doc doesn't exist, create it */
      console.log('Do not fear, the document will be created now!');
      return db.put(designDoc);
    }
    else console.log(err);
  }).then(function (result) {
    if (result) { /* Result is undefined if db.put does not run */
      console.log(result);
      console.log('The design doc ' + '"' + designDocId + '" has been created!');
    }
  }).catch(function (err) {
    console.log('An attempt at creating the design doc failed!');
    console.log(err);
  });
}
