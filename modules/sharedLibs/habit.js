/* Check if we're on node; if so, we need to require stuff; if not, the
 * code was imported in the html with <script> tags*/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');


/**
 * Creates a new Habit object
 * @param {string} name the name of the new habit
 * @param {number} amount the amount of money rewarded to the user when the
 *   habit is completed
 * @param {Array.<Habit~LogEntry>} log an array of completion date string and amount pairs to
 *   represent each day the habit was completed -- optional
 * @returns {Habit} the newly created habit
 */
function Habit(name, amount, log) {
  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else this.name = name;

  if (typeof amount !== 'number')
    throw new Error('amount must be a valid number');
  else
    this.amount = amount;

  if (typeof log === 'undefined')
    this.log = [];
  else if (typeof log !== 'array')
    throw new Error('log must be a valid array');
  else
    this.log = log;
}

/**
 * For storing amount and date data for habit completion
 * @typedef {Object} Habit~LogEntry
 * @property {string} date the date of the completion
 * @property {number} amount amount added to balance for completion
 */

/* Checks whether the habit was completed on the day given by the
 * date array */
Habit.prototype.isComplete = function(dateStr) {
  return this.log.reduce((acc, current) => {
    return acc || current.date === dateStr;
  }, false);
};

Habit.prototype.complete = function(dateStr) {
  if (!this.isComplete(dateStr))
    this.log.push({
      date: dateStr,
      amount: this.amount
    });
};

Habit.prototype.uncomplete = function(dateStr) {
  this.log = this.log.filter(function (fromLog) {
    return !(fromLog.date === dateStr);
  });
};

/* Returns an object that is ready to be placed into the db as a document,
 * or used as a delta for updating an existing document */
Habit.prototype.toDoc = function() {
  let res = {
    name: this.name,
    amount: this.amount,
    type: 'habit'
  };
  res.log = this.log.map(function (curr) {
    return {
      amount: curr.amount,
      date: curr.date.dateToArray()
    };
  });
  return res;
};

Habit.fromDoc = function(doc) {
  if (doc.log) {
    doc.log = doc.log.map((curr) => {
      return {
        amount: curr.amount,
        date: curr.date.dateToStr()
      }
    });
  }
  return new Habit(doc.name, doc.amount, doc.log);
}

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Habit;
else
  window.Habit = Habit;
