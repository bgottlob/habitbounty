function Balance(amount) {
  if (amount) this.amount = amount;
  else this.amount = 0;
}

Balance.prototype.toDoc = function() {
  return {
    _id: 'balance',
    amount: this.amount,
    type: 'balance'
  };
};

Balance.prototype.changeAmountBy = function(changeAmt) {
  this.amount += changeAmt;
};

/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Balance;
else
  window.Balance = Balance;
