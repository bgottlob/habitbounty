/* Check if we're on node; if so, we need to require stuff; if not, the
 * code was imported in the html with <script> tags*/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');

/**
 * Checks whether a string represents a real date in ISO 8601 format.
 *
 * @param {string} dateStr the string to be validated
 * @returns {?error} an error if the date string is invalid, otherwise
 *   returns null
 */
function validateDateStr(dateStr) {
  let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    // Use new Date to see if the string is a valid date by Date's standards
    // Then, parse the date component out of the ISO date string and make sure
    // it matches up properly to the original date string, since Date will
    // interpret '2017-02-29' as March 1, 2017, even though Feb 29 2017 is not
    // a real day
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Error('date string does not represent a valid date');
    } else {
      if (dateStr === date.toISOString().split('T')[0])
        return null;
      else
        return new Error('date string does not represent a valid date');
    }
  } else {
    return new Error('date string must be in the format YYYY-MM-DD');
  }
}

/**
 * Checks whether a number represents a number with two or fewer decimal
 * places in precision.
 *
 * @param {number} num the number to be validated
 * @returns {?error} an error if the number is not valid or more precise
 *   than two decimal places, otherwise returns null
 */
// TODO: The error messaging could be smarter here
function validateNumber(num) {
  var digsAfterDec = 2; // Precision to enforce
  if (isNaN(num) || typeof num !== 'number')
    return new Error('not a valid number');
 // toFixed returns string, need != instead of !==
  else if (num.toFixed(digsAfterDec) != num)
    return new Error('amount ' + num + ' must be no more precise than ' +
      digsAfterDec + ' digits after the decimal');
  else return null;
}

/**
 * A single entry in the habit log. Represents an instance when a habit was
 * completed.
 * @typedef LogEntry
 * @type {object}
 * @property {string} date - the date the habit was completed
 * @property {number} amount - the amount rewarded for completion of the habit
 */

/**
 * Validate a LogEntry object. Ensure it contains a valid date, a valid amount,
 * and no extraneous elements.
 *
 * @param {LogEntry} entry the log entry to be validated
 * @returns {?error} an error if the log entry is invalid, null if not
 */
function validateLogEntry(entry) {
  let err = null;
  if (err = validateNumber(entry.amount)) return err;
  else if (err = validateDateStr(entry.date)) return err;
  else {
    // Check for extra data in the object
    allowed = ['amount', 'date'];
    extras = Object.keys(entry).filter((key) => allowed.indexOf(key) === -1);
    if (extras.length > 0)
      err = new Error('there are more attributes than just amount and date');
    return err;
  }
}

/**
 * Creates a new Habit object
 * @param {string} name the name of the new habit
 * @param {number} amount the amount of money rewarded to the user when the
 *   habit is completed
 * @param {Array<LogEntry>} log an array of completion date string and amount pairs to
 *   represent each day the habit was completed -- optional
 * @returns {Habit} the newly created habit
 */
function Habit(name, amount, log) {
  let err = null;

  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else this.name = name;

  // isNaN will return false for strings like '12', so must also check if the
  // type is a number. NaN's type is 'number', so must check for NaN
  if (err = validateNumber(amount))
    throw new Error('amount must be a valid number');
  else
    this.amount = amount;

  if (typeof log === 'undefined')
    this.log = [];
  else if (!Array.isArray(log))
    throw new Error('log must be a valid array');
  else {
    for (let i = 0; i < log.length; i++) {
      if (err = validateLogEntry(log[i])) throw err;
    }
    this.log = log;
  }

}

/**
 * Checks whether the habit was completed on the date given by the date string.
 *
 * @param {string} dateStr a string of the date to be checked for completion
 * @returns {boolean} indicates whether habit was completed on the given date
 *   or not
 */
Habit.prototype.isComplete = function(dateStr) {
  let err = validateDateStr(dateStr);
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
  let err = validateDateStr(dateStr);
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
 * TODO: Throw error if doc.type isn't "habit"?
 * @param {object} doc the CouchDB doc to be converted to a Habit
 * @returns {Habit} the habit doc populated with the data from the doc
 */
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
