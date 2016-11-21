const moment = require('moment');

function Habit(name, reward) {
  if (!name) this.name = 'No Name Set';
  else this.name = String(name);

  this.reward = Number(reward);
  if (isNaN(this.reward)) this.reward = 0;

  this.log = [];
}

/* Checks whether the habit was completed today */
Habit.prototype.isComplete = function() {
  const now = moment();
  console.log(this);
  console.log(this.log);
  return this.log.reduce((acc, current) => {
    return acc || now.isSame(current, 'day');
  }, false);
};

Habit.prototype.complete = function() {
  if (!this.isComplete())
    this.log.push(moment());
};

var hab = new Habit("blah", 2);
hab = new Habit();
console.log(hab);
console.log(hab.isComplete());
hab.complete();
console.log(hab.isComplete());
hab.complete();
console.log(hab);
