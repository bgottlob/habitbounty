require('./sharedLib');
const validate = require('./validate');

module.exports = Task;

/**
 * Creates a new Task object
 * @constructs Task
 * @param {string} name the name of the new task
 * @param {number} amount the amount of money rewarded to the user when the
 *   task is completed
 * @param {string} [dateCompleted=null] the date the task was completed, if it
 *   has been completed
 * @returns {Task} the newly created task
 */
function Task(name, amount, dateCompleted) {
  let err = null;

  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else
    this.name = String(name);

  if (err = validate.number(amount))
    throw err;
  else
    this.amount = Number(amount);

  if (dateCompleted) {
    if (err = validate.dateStr(dateCompleted))
      throw err;
    else
      this.dateCompleted = dateCompleted;
  }
  else
    this.dateCompleted = null;
}

Task.prototype.toDoc = function() {
  let doc =  {
    type: 'task',
    name: this.name,
    amount: this.amount
  };

  if (this.dateCompleted) doc.dateCompleted = this.dateCompleted.dateToArray();
  else doc.dateCompleted = null;

  return doc;
};

Task.fromDoc = function(doc) {
  let dateCompleted = doc.dateCompleted;
  if (dateCompleted) dateCompleted = doc.dateCompleted.dateToStr();
  return new Task(doc.name, doc.amount, dateCompleted);
}

Task.prototype.complete = function(dateStr) {
  if (err = validate.dateStr(dateStr)) throw err;
  else this.dateCompleted = dateStr;
};

Task.prototype.uncomplete = function() {
  this.dateCompleted = null;
};

Task.prototype.completed = function() {
  return !!this.dateCompleted;
};
