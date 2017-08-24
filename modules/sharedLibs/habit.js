module.exports = Habit;
require('./sharedLib.js');
const validate = require('./validate.js');

/**
 * A single entry in the habit log. Represents an instance when a habit was
 * completed.
 * @typedef LogEntry
 * @type {object}
 * @property {string} date the date the habit was completed
 * @property {number} amount the amount rewarded for completion of the habit
 */

/**
 * Creates a new Habit object
 * @constructs Habit
 * @param {string} name the name of the new habit
 * @param {number} amount the amount of money rewarded to the user when the
 *   habit is completed
 * @param {Array<LogEntry>} [log=[]] an array of completion date string and amount
 *   pairs to represent each day the habit was completed
 * @returns {Habit} the newly created habit
 */
function Habit(name, amount, log) {
  let err = null;

  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else this.name = name;

  if (err = validate.number(amount))
    throw err;
  else
    this.amount = amount;

  if (typeof log === 'undefined')
    this.log = [];
  else if (!Array.isArray(log))
    throw new Error('log must be a valid array');
  else {
    for (let i = 0; i < log.length; i++) {
      if (err = validate.logEntry(log[i])) throw err;
    }
    this.log = log;
  }

}

/**
 * Checks whether the habit was completed on the date given by the date string.
 *
 * @param {string} dateStr a string of the date to be checked for completion
 * @returns {boolean} true if habit was completed on the given date, false if
 *   not
 */
Habit.prototype.isComplete = function(dateStr) {
  let err = validate.dateStr(dateStr);
  if (err) throw err;
  return this.log.reduce((acc, current) => {
    return acc || current.date === dateStr;
  }, false);
};

/**
 * Marks the habit to be completed on a given date by adding a log entry to
 * the Habit object's log. This has no effect if the habit has already been
 * completed on the given date.
 *
 * @param {string} dateStr a string of the date the habit is to be completed on
 */
Habit.prototype.complete = function(dateStr) {
  if (!this.isComplete(dateStr))
    this.log.push({
      date: dateStr,
      amount: this.amount
    });
};

/**
 * Removes a completion entry from the Habit object's log on the given date.
 * This has the opposite effect as Habit#complete. This has no effect if the
 * habit was not completed on the given date.
 *
 * @param {string} dateStr a string of the date the habit should not be
 *   completed
 */
Habit.prototype.uncomplete = function(dateStr) {
  let err = validate.dateStr(dateStr);
  if (err) throw err;
  this.log = this.log.filter(function (fromLog) {
    return !(fromLog.date === dateStr);
  });
};

/**
 * Returns an object representation of a habit that is ready to be placed into
 * the db as a document or used as a delta for updating an existing document.
 *
 * @returns {object} the habit data encoded into an object friendly to the
 *   CouchDB database
 */
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

/**
 * Creates a habit object from a habit document that was present in the CouchDB
 * database.
 * @param {object} doc the CouchDB doc to be converted to a Habit
 * @returns {Habit} the Habit object populated with the data from the doc
 */
// TODO: Throw error if doc.type isn't "habit"?
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

