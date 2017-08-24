/* A file of functions that is shared among front-end and back-end code.
 * No functions need to be explicitly exported yet since functions are
 * simply added to existing core JavaScript prototypes */

/* Checks whether two arrays are equal.
 * Used to check date equality for date arrays in the log */
Array.prototype.isSame = function(other) {
  let acc = this.length == other.length;
  for (let i = 0; i < this.length; i++) {
    if (!acc) return acc;
    acc = acc && this[i] == other[i];
  }
  return acc;
};

/* TODO: Only allow single characters */
String.prototype.paddedStart = function(tgtLen, padStr) {
  let result = new String(this);
  while (result.length < tgtLen)
    result = padStr + result;
  return result;
}

/* TODO: should check that the length of this is 3 */
Array.prototype.dateToStr = function() {
  return [
    String(this[0]).paddedStart(4, '0'),
    String(this[1]).paddedStart(2, '0'),
    String(this[2]).paddedStart(2, '0')
  ].join('-');
}

/* TODO: Might want to validate the date here as well? */
String.prototype.dateToArray = function() {
  return this.split('-').map((x) => Number(x));
}

/* Converts a Date object into a [year, month, day]. Note that months are
 * zero indexed to keep with standard set by JavaScript Date and moment */
Date.prototype.toLocalArray = function() {
  return [this.getFullYear(), this.getMonth(), this.getDate()]
};
