module.exports = Chore;
require('./sharedLib.js');
const validate = require('./validate.js');

// TODO: At some point it may be necessary to have actual differences between
// the habit proto's log entry format and that of the chore proto
/**
 * A single entry in the chore log. Represents an instance when a chore was
 * completed.
 * @typedef LogEntry
 * @type {object}
 * @property {string} date the date the chore was completed
 * @property {number} amount the amount rewarded for completion of the chore
 */

/**
 * Creates a new Chore object
 * @constructs Chore
 * @param {string} name the name of the new chore
 * @param {number} amount the amount of money rewarded to the user when the
 *   chore is completed
 * @param {Array<LogEntry>} [log=[]] an array of completion date string and amount
 *   pairs to represent each day the chore was completed
 * @returns {Chore} the newly created chore
 */
function Chore(name, amount, log) {
  let err = null;

  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else this.name = String(name);

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
 * Checks whether the chore was completed on the date given by the date string.
 *
 * @param {string} dateStr a string of the date to be checked for completion
 * @returns {boolean} true if chore was completed on the given date, false if
 *   not
 */
Chore.prototype.isComplete = function(dateStr) {
  let err = validate.dateStr(dateStr);
  if (err) throw err;
  return this.log.reduce((acc, current) => {
    return acc || current.date === dateStr;
  }, false);
};

/**
 * Marks the chore to be completed on a given date by adding a log entry to
 * the Chore object's log. This has no effect if the chore has already been
 * completed on the given date.
 *
 * @param {string} dateStr a string of the date the chore is to be completed on
 */
Chore.prototype.complete = function(dateStr) {
  if (!this.isComplete(dateStr))
    this.log.push({
      date: dateStr,
      amount: this.amount
    });
};

/**
 * Removes a completion entry from the Chore object's log on the given date.
 * This has the opposite effect as Chore#complete. This has no effect if the
 * chore was not completed on the given date.
 *
 * @param {string} dateStr a string of the date the chore should not be
 *   completed
 */
Chore.prototype.uncomplete = function(dateStr) {
  let err = validate.dateStr(dateStr);
  if (err) throw err;
  this.log = this.log.filter(function (fromLog) {
    return !(fromLog.date === dateStr);
  });
};

/**
 * Returns an object representation of a chore that is ready to be placed into
 * the db as a document or used as a delta for updating an existing document.
 *
 * @returns {object} the chore data encoded into an object friendly to the
 *   CouchDB database
 */
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

/**
 * Creates a chore object from a chore document that was present in the CouchDB
 * database.
 * @param {object} doc the CouchDB doc to be converted to a Chore
 * @returns {Chore} the Chore object populated with the data from the doc
 */
// TODO: Throw error if doc.type isn't "chore"?
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
