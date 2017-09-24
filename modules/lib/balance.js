function Balance(log, initAmt) {
  this.log = log;
  if (!log) this.log = [];

  if (!initAmt) initAmt = 0;
  this.changeAmountBy(initAmt);
}

Balance.prototype.toDoc = function() {
  return {
    _id: 'balance',
    type: 'balance',
    log: this.log
  };
};

Balance.prototype.changeAmountBy = function (changeAmt) {
  changeAmt = Number(changeAmt);
  if (!isNaN(changeAmt)) this.log.push(changeAmt);
};

Balance.prototype.amount = function () {
  return this.log.reduce(function (amt, curr) {
    return amt + curr;
  }, 0);
}


/* Support importing into browser or node */
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = Balance;
else
  window.Balance = Balance;
