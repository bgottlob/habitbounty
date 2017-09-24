/* Import the shared library on both server and client sides */
require('lib/sharedLib');
const validate = require('lib/validate');

module.exports = Expense;

/**
 * Creates a new Expense object
 * @constructs Expense
 * @param {string} name the name of the new expense
 * @param {number} amount the amount of money charged to the user when the
 *   expense is confirmed
 * @param {string} [dateCharged=null] the date the expense was charged, if it
 *   has been charged
 * @returns {Expense} the newly created expense
 */
function Expense(name, amount, dateCharged) {
  let err = null;

  if (typeof name !== 'string')
    throw new Error('name parameter must be a valid string');
  else
    this.name = String(name);

  if (err = validate.number(amount))
    throw err;
  else
    this.amount = Number(amount);

  if (dateCharged) {
    if (err = validate.dateStr(dateCharged))
      throw err;
    else
      this.dateCharged = dateCharged;
  }
  else
    this.dateCharged = null;
}

/**
 * Returns an object representation of an expense that is ready to be placed
 * into the db as a document or used as a delta for updating an existing
 * document.
 *
 * @returns {object} the expense data encoded into an object friendly to the
 *   CouchDB database
 */
Expense.prototype.toDoc = function() {
  let doc =  {
    type: 'expense',
    name: this.name,
    amount: this.amount
  };

  if (this.dateCharged) doc.dateCharged = this.dateCharged.dateToArray();
  else doc.dateCharged = null;

  return doc;
};

/**
 * Creates a expense object from a expense document that was present in the
 * CouchDB database.
 *
 * @param {object} doc the CouchDB doc to be converted to a Expense
 * @returns {Expense} the Expense object populated with the data from the doc
 */
// TODO: Throw error if doc.type isn't "expense"?
Expense.fromDoc = function(doc) {
  let dateCharged = doc.dateCharged;
  if (dateCharged) dateCharged = doc.dateCharged.dateToStr();
  return new Expense(doc.name, doc.amount, dateCharged);
}

/**
 * Charges an expense with the given date
 * @param {string} dateStr the date the expense is to be charged
 */
Expense.prototype.charge = function(dateStr) {
  if (err = validate.dateStr(dateStr)) throw err;
  else this.dateCharged = dateStr;
};

/**
 * Clears the date charged of the expense. In the context of calculating the
 * user's balance, an uncharged expense would not count towards the balance.
 */
Expense.prototype.uncharge = function() {
  this.dateCharged = null;
};

/**
 * Returns whether or not the date has been charged
 * @return {boolean} true if expense has been charged, false if not
 */
Expense.prototype.charged = function() {
  return !!this.dateCharged;
};
