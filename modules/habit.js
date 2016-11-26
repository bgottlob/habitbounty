const moment = require('moment');
const logCoder = require('./logCoder');
module.exports = Habit;

function Habit(name, reward, log) {
  if (!name) this.name = 'No Name Set';
  else this.name = String(name);

  this.reward = Number(reward);
  if (isNaN(this.reward)) this.reward = 0;

  this.log = log;
  if (!log) this.log = [];
}

/* Checks whether the habit was completed today */
Habit.prototype.isComplete = function() {
  const now = moment();
  return this.log.reduce((acc, current) => {
    return acc || now.isSame(current, 'day');
  }, false);
};

Habit.prototype.complete = function() {
  if (!this.isComplete())
    this.log.push(moment());
};

/* Returns an object that is ready to be placed into the db as a document */
Habit.prototype.toDoc = function() {
  return {
    name: this.name,
    reward: this.reward,
    log: logCoder.encodeLog(this.log),
    type: 'habit'
  };
};
