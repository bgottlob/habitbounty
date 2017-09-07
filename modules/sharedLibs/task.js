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

/**
 * Returns an object representation of an task that is ready to be placed
 * into the db as a document or used as a delta for updating an existing
 * document.
 *
 * @returns {object} the task data encoded into an object friendly to the
 *   CouchDB database
 */
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

/**
 * Creates a task object from a task document that was present in the
 * CouchDB database.
 *
 * @param {object} doc the CouchDB doc to be converted to a Task
 * @returns {Task} the Task object populated with the data from the doc
 */
// TODO: Throw error if doc.type isn't "task"?
Task.fromDoc = function(doc) {
  let dateCompleted = doc.dateCompleted;
  if (dateCompleted) dateCompleted = doc.dateCompleted.dateToStr();
  return new Task(doc.name, doc.amount, dateCompleted);
}

/**
 * Completes a task with the given date
 * @param {string} dateStr the date the task is to be completed
 */
Task.prototype.complete = function(dateStr) {
  if (err = validate.dateStr(dateStr)) throw err;
  else this.dateCompleted = dateStr;
};

/**
 * Clears the date completed of the task. In the context of calculating the
 * user's balance the uncompleted task would not count towards the balance.
 */
Task.prototype.uncomplete = function() {
  this.dateCompleted = null;
};

/**
 * Returns whether or not the task has been completed
 * @return {boolean} true if the task has been completed, false if not
 */
Task.prototype.completed = function() {
  return !!this.dateCompleted;
};
