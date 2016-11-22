var loader = module.exports;

const PouchDB = require('pouchdb');
const Habit = require('./habit.js');

const url = 'http://localhost';
const port = 5984;
//var db = new(cradle.Connection)(url, port).database('habitbounty');
var db = new PouchDB(url + ':' + port + '/habitbounty', {
  auth: {
    username: process.env.COUCH_USER,
    password: process.env.COUCH_PASS
  }
});

loader.createHabit = (title, reward, callback) => {
  db.post({ type: 'habit', title: title, reward: reward }, (err, response) => {
    if (err) console.log(err);
    else console.log('Habit was created!!');
  });
};

loader.getHabit = (docId, callback) => {
  db.get(docId, (err, doc) => {
    if (err) console.log(err);
    else callback(doc);
  });
};

loader.allHabits = (callback) => {
  db.query('queries/all_habits', (err, result) => {
    if (err) console.log(err);
    else {
      resList = [];
      result.rows.forEach((row) => {
        resList.push(row.value);
      });
      callback(resList);
    }
  });
};

const mapAllHabits = function(doc) {
  if (doc.type === 'habit') {
    emit(doc._id, { title: doc.title, reward: doc.reward });
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

pushDesignDoc();
