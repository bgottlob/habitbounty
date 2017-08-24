/* A module of functions that is to be shared among front-end and back-end code.
 * These functions can be used to validate commonly used data types. */
let validate = {};
/** @module validate */
// TODO: get all functions doc-ed here
module.exports = {
  number: number
};

/**
 * Checks whether a string represents a real date in ISO 8601 format.
 *
 * @param {string} dateStr the string to be validated
 * @returns {?error} an error if the date string is invalid, otherwise
 *   returns null
 */
validate.dateStr = function(dateStr) {
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
 * module:validate~number
 * Checks whether a number represents a number with two or fewer decimal
 * places in precision.
 *
 * @param {number} num the number to be validated
 * @returns {?error} an error if the number is not valid or more precise
 *   than two decimal places, otherwise returns null
 */
// TODO: The error messaging could be smarter here
//validate.number = function(num) {
function number(num) {
  var digsAfterDec = 2; // Precision to enforce
  // isNaN will return false for strings like '12', so must also check if the
  // type is a number. NaN's type is 'number', so must check for NaN
  if (isNaN(num) || typeof num !== 'number')
    return new Error('not a valid number');
 // toFixed returns string, need != instead of !==
  else if (num.toFixed(digsAfterDec) != num)
    return new Error('amount ' + num + ' must be no more precise than ' +
      digsAfterDec + ' digits after the decimal');
  else return null;
}

/**
 * Validate a LogEntry object. Ensure it contains a valid date, a valid amount,
 * and no extraneous elements.
 *
 * @param {LogEntry} entry the log entry to be validated
 * @returns {?error} an error if the log entry is invalid, null if not
 */
validate.logEntry = function(entry) {
  let err = null;
  if (err = validate.number(entry.amount)) return err;
  else if (err = validate.dateStr(entry.date)) return err;
  else {
    // Check for extra data in the object
    allowed = ['amount', 'date'];
    extras = Object.keys(entry).filter((key) => allowed.indexOf(key) === -1);
    if (extras.length > 0)
      err = new Error('there are more attributes than just amount and date');
    return err;
  }
}
