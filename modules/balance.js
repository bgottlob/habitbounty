module.exports = Balance;

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
