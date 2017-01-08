module.exports = Habit;

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

function Habit(name, reward, log) {
  if (!name) this.name = 'No Name Set';
  else this.name = String(name);

  this.reward = Number(reward);
  if (isNaN(this.reward)) this.reward = 0;

  this.log = log;
  if (!log) this.log = [];
}

/* Checks whether the habit was completed on the day given by the
 * date array */
Habit.prototype.isComplete = function(dateArray) {
  return this.log.reduce((acc, current) => {
    return acc || current.isSame(dateArray);
  }, false);
};

Habit.prototype.complete = function(dateArray) {
  if (!this.isComplete(dateArray))
    this.log.push(dateArray);
};

/* Returns an object that is ready to be placed into the db as a document */
Habit.prototype.toDoc = function() {
  return {
    name: this.name,
    reward: this.reward,
    log: this.log,
    type: 'habit'
  };
};
