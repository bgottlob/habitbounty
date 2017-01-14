/* A file of functions that is shared among front-end and back-end code.
 * No functions need to be explicitly exported yet since functions are
 * simply added to existing core JavaScript prototypes */

/* Checks whether two arrays are equal.
 * Used to check date equality for date arrays in the log */
Array.prototype.isSame = function(other) {
  var acc = this.length == other.length;
  for (var i = 0; i < this.length; i++) {
    if (!acc) return acc;
    acc = acc && this[i] == other[i];
  }
  return acc;
};

/* Converts a Date object into a [year, month, day]. Note that months are
 * zero indexed to keep with standard set by JavaScript Date and moment */
Date.prototype.toLocalArray = function() {
  return [this.getFullYear(), this.getMonth(), this.getDate()]
};

