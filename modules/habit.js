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

/* Returns an object that is ready to be placed into the db as a document */
Habit.prototype.toDoc = function() {
  return {
    name: this.name,
    reward: this.reward,
    log: encodeLog(this.log)
  };
}

/* Encodes moments into arrays of UTC timestamps */
function encodeLog(log) {
  return log.map((mDate) => {
    /* Set flag on the moment to use UTC in the following calls */
    mDate.utc();
    return [mDate.year(), mDate.month(), mDate.date(), mDate.hour(), mDate.minute()];
  });
}

/* Decodes arrays of UTC timestamps into moments */
function decodeLog(log) {
  return log.map((utcArr) => {
    moment.utc(utcArr).local();
  });
}

var hab = new Habit("blah", 2);
hab = new Habit();
hab.complete();
