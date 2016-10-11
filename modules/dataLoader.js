var loader = module.exports;

const cradle = require('cradle');

const url = 'http://localhost';
const port = 5984;
var db = new(cradle.Connection)(url, port).database('habitbounty');


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
