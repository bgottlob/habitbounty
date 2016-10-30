var loader = module.exports;

const cradle = require('cradle');
const PouchDB = require('pouchdb');

const url = 'http://localhost';
const port = 5984;
//var db = new(cradle.Connection)(url, port).database('habitbounty');
var db = new PouchDB(url + ':' + port + '/habitbounty', {
  auth: {
    username: process.env.COUCH_USER,
    password: process.env.COUCH_PASS
  }
});


loader.all_habits = function(callback) {
  var resList = [];
  db.view('hb-couch/all-habits', (err, res) => {
    if (err)
      console.log('Could not get the view, log it');

    res.forEach((row) => {
      resList.push(row);
    });

    console.log(resList);
    console.log(callback);
    callback(err, resList);
  });
};

const map = function(doc) {
  if (doc.type === 'habit') {
    emit(doc._id, { name: doc.name, timing: doc.timing, reward: doc.reward });
  }
};

loader.pouch_all_habits = function(callback) {
  db.query('hb-couch/all-habits').then((result) => {
    resList = [];
    result.rows.forEach((row) => {
      resList.push(row.value);
    });
    callback(resList);
  }).catch((err) => {
    console.log(err);
  });
};
