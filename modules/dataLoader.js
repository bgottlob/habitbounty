var loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./habit.js');
const logCoder = require('./logCoder');

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
    return console.log('The parameter is not an instance of Habit prototype');
    /* There's probably some better way of doing this
    callback({
      error: 'bad_data_type',
      param: habit,
      message: 'The parameter is not an instance of the Habit prototype'
    });
    */
  }
  else {
    db.post(habit.toDoc(), function(err, response) {
      if (err) return console.log(err);
      else return console.log(response);
    });
  }
};

loader.getHabit = (docId, callback) => {
  db.get(docId, (err, doc) => {
    if (err) return console.log(err);
    else return callback(doc);
  });
};

loader.allHabits = (callback) => {
  db.query('queries/all_habits', (err, result) => {
    if (err) return console.log(err);
    else {
      resList = [];
      result.rows.forEach((row) => {
        var habit = new Habit(row.value.name, row.value.reward,
                              logCoder.decodeLog(row.value.log));
        habit.id = row.id;
        resList.push(habit);
      });
      return callback(resList);
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
loader.allHabits(console.log);
