var loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./sharedLibs/habit.js');
const Balance = require('./sharedLibs/balance.js');

const url = 'http://localhost';
const port = 5984;
var db = new PouchDB(url + ':' + port + '/habitbounty', {
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
      param: habit,
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
  return db.put(doc).then(function (response) {
    return Promise.resolve(response);
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

/* TODO: get rid of updateHabit -- will need to remove call in root/index.js */
loader.updateHabit = loader.updateDoc;
loader.getHabit = loader.getDoc;

loader.allHabits = function() {
  db.query('queries/all_habits').then(function (result) {
    resList = [];
    result.rows.forEach(function (row) {
      var habit = new Habit(row.value.name, row.value.reward, row.value.log);
      habit.id = row.id;
      resList.push(habit);
    });
    return Promise.resolve(resList);
  }).catch(function (err) {
    return Promise.reject(err);
  });
};

const mapAllHabits = function(doc) {
  if (doc.type === 'habit') {
    emit(doc._id, { name: doc.name, reward: doc.reward, log: doc.log });
  }
};

var designDocId = '_design/queries';
var designDoc = {
  _id: designDocId,
  views: {
    all_habits: {
      map: mapAllHabits.toString()
    }
  }
};

/* TODO: This needs to be tested for proper control flow */
pushDesignDoc = () => {
  db.get(designDocId).then(function (doc) {
    /* Design doc exists, get the revision number and push the updated doc */
    designDoc._rev = doc._rev;
    return db.put(designDoc);
  }).then(function (response) {
    console.log('The design doc ' + '"' + designDocId + '" has been updated!');
  }).catch(function (err) {
    if (err.error === 'not_found') {
      /* Design doc doesn't exist, create it */
      return db.put(designDoc);
    }
    else console.log(err);
  }).then(function (result) {
    console.log('The design doc ' + '"' + designDocId + '" has been created!');
  }).catch(function (err) {
    console.log(err);
  });
}
