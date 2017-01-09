var loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./habit.js');
const Balance = require('./balance.js');

const url = 'http://localhost';
const port = 5984;
var db = new PouchDB(url + ':' + port + '/habitbounty', {
  auth: {
    username: process.env.COUCH_USER,
    password: process.env.COUCH_PASS
  }
});

/* Pushes a Habit object as a new document in the database */
loader.createHabit = function(habit, callback) {
  if (!(habit instanceof Habit)) {
    return callback({
      error: 'bad_data_type',
      param: habit,
      message: 'The parameter is not an instance of the Habit prototype'
    });
  }
  else {
    db.post(habit.toDoc(), function(err, result) {
      if (err) return callback(err);
      else return callback(null, result);
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

loader.allHabits = (callback) => {
  db.query('queries/all_habits', (err, result) => {
    if (err) return callback(err);
    else {
      resList = [];
      result.rows.forEach((row) => {
        var habit = new Habit(row.value.name, row.value.reward, row.value.log);
        habit.id = row.id;
        resList.push(habit);
      });
      return callback(null, resList);
    }
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

pushDesignDoc = () => {
  db.get(designDocId, (err, doc) => {
    if (err) {
      if (err.error === 'not_found') {
        /* Design doc doesn't exist, create it */
        db.put(designDoc, (err, response) => {
          if (err)
            console.log(err);
          else
            console.log('The design doc ' + '"' + designDocId +
                        '" has been created!');
        });
      }
      else
        console.log(err);
    } else {
      /* Design doc exists, get the revision number and push the updated doc */
      designDoc._rev = doc._rev;
      db.put(designDoc, (err, response) => {
        if (err) console.log(err);
        else
          console.log('The design doc ' + '"' + designDocId +
                      '" has been updated!');
      });
    }
  });
}

//pushDesignDoc();
/*
var habs = [new Habit("Take a walk", 3.32), new Habit("Make bed", 0.05),
            new Habit("Wash behind ear", 0.35)];
habs[0].complete();
habs[2].complete();
habs.forEach((hab) => { loader.createHabit(hab) });
*/
//loader.allHabits(console.log);
