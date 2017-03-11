function Expense(name, amount, dateCharged) {
  this.name = String(name);
  this.amount = Number(amount);

  if (dateCharged) this.dateCharged = dateCharged;
  else this.dateCharged = null;
}

Expense.prototype.toDoc = function() {
  let doc =  {
    type: 'expense',
    name: this.name,
    amount: this.amount,
    dateCharged: this.dateCharged
  };
  return doc;
};

Expense.prototype.charge = function(dateArray) {
  this.dateCharged = dateArray;
};

Expense.prototype.uncharge = function() {
  this.dateCharged = null;
};

Expense.prototype.charged = function() {
  return !!this.dateCharged;
};

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Expense;
else
  window.Expense = Expense;
