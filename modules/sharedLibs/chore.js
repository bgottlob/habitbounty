/* Check if we're on node; if so, we need to require stuff; if not, the
 * code was imported in the html with <script> tags*/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');

function Chore(name, amount, log) {
  if (!name) this.name = 'No Name Set';
  else this.name = String(name);

  this.amount = Number(amount);
  if (isNaN(this.amount)) this.amount = 0;

  this.log = log;
  if (!log) this.log = [];
}

/* Checks whether the chore was completed on the day given by the
 * date array */
Chore.prototype.isComplete = function(dateStr) {
  return this.log.reduce((acc, current) => {
    return acc || current.date === dateStr;
  }, false);
};

Chore.prototype.complete = function(dateStr) {
  if (!this.isComplete(dateStr))
    this.log.push({
      date: dateStr,
      amount: this.amount
    });
};

Chore.prototype.uncomplete = function(dateStr) {
  this.log = this.log.filter(function (fromLog) {
    return !(fromLog.date === dateStr);
  });
};

/* Returns an object that is ready to be placed into the db as a document */
Chore.prototype.toDoc = function() {
  let res = {
    name: this.name,
    amount: this.amount,
    type: 'chore'
  };
  res.log = this.log.map(function (curr) {
    return {
      amount: curr.amount,
      date: curr.date.dateToArray()
    };
  });
  return res;
};

Chore.fromDoc = function(doc) {
  if (doc.log) {
    doc.log = doc.log.map((curr) => {
      return {
        amount: curr.amount,
        date: curr.date.dateToStr()
      }
    });
  }
  return new Chore(doc.name, doc.amount, doc.log);
}

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Chore;
else
  window.Chore = Chore;
