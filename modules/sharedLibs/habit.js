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

Habit.prototype.uncomplete = function(dateArray) {
  this.log = this.log.filter(function (fromLog) {
    return !fromLog.isSame(dateArray);
  });
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

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Habit;
else
  window.Habit = Habit;
