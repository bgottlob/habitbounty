/* Check if we're on node; if so, we need to require stuff; if not, the
 * code was imported in the html with <script> tags*/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');

// Returns an error if there is the date string is invalid, otherwise returns
// null
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

// TODO: The error messaging could be smarter here
// Return an error if there is one
function validateNumber(num) {
  var digsAfterDec = 2; // Precision to enforce
  if (isNaN(num) || typeof num !== 'number')
    return new Error('not a valid number');
  else if (num.toFixed(digsAfterDec) != num) // toFixed returns string, need != instead of !==
    return new Error('amount ' + num + ' must be no more precise than ' +
      digsAfterDec + ' digits after the decimal');
  else return null;
}

// Return an error if there is one
// TODO: Check for extra properties!
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
 * @param {Array.<Habit~LogEntry>} log an array of completion date string and amount pairs to
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
