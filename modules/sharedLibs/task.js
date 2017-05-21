/* Import the shared library on both server and client sides */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  require('./sharedLib.js');

function Task(name, amount, dateCompleted) {
  this.name = String(name);
  this.amount = Number(amount);

  if (dateCompleted) this.dateCompleted = dateCompleted;
  else this.dateCompleted = null;
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
  this.dateCompleted = dateStr;
};

Task.prototype.uncomplete = function() {
  this.dateCompleted = null;
};

Task.prototype.completed = function() {
  return !!this.dateCompleted;
};

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Task;
else
  window.Task = Task;
