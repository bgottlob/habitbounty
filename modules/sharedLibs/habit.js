/* Check if we're on node; if so, we need to require stuff; if not, the
 * code was imported in the html with <script> tags*/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');

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
Habit.prototype.isComplete = function(dateStr) {
  return this.log.reduce((acc, current) => {
    return acc || current.date === dateStr;
  }, false);
};

Habit.prototype.complete = function(dateStr) {
  if (!this.isComplete(dateStr))
    this.log.push({
      date: dateStr,
      reward: this.reward
    });
};

Habit.prototype.uncomplete = function(dateStr) {
  this.log = this.log.filter(function (fromLog) {
    return !(fromLog.date === dateStr);
  });
};

/* Returns an object that is ready to be placed into the db as a document */
Habit.prototype.toDoc = function() {
  let res = {
    name: this.name,
    reward: this.reward,
    type: 'habit'
  };
  res.log = this.log.map(function (curr) {
    return {
      reward: curr.reward,
      date: curr.date.dateToArray()
    };
  });
  return res;
};

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Habit;
else
  window.Habit = Habit;
