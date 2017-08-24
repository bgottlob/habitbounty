const assert = require('assert');
const Expense = require('../../modules/sharedLibs/expense');

describe('Expense', function() {

  describe('constructor', function() {
    // TODO: Add error types
    it('should throw invalid name errors', function() {
      assert.throws(() => new Expense(2, 2));
      assert.throws(() => new Expense(0, 2));
      assert.throws(() => new Expense(false, 2));
      assert.throws(() => new Expense(true, 2));
      assert.throws(() => new Expense(['name'], 2));
      assert.throws(() => new Expense(undefined, 2));
      assert.throws(() => new Expense(null, 2));
      assert.throws(() => new Expense(NaN, 2));
      assert.throws(() => new Expense({name:'name'}, 2));
    });

    it('should throw an invalid number error', function() {
      assert.throws(() => new Expense('Test', '2'));
      assert.throws(() => new Expense('Test', '2.4'));
      assert.throws(() => new Expense('Test', '2.41'));
      assert.throws(() => new Expense('Test', 2.411));
      assert.throws(() => new Expense('Test', 2.001));
      assert.throws(() => new Expense('Test', 2.0000000001));
      assert.throws(() => new Expense('Test', 2.0100000001));
      assert.throws(() => new Expense('Test', 'Test'));
      assert.throws(() => new Expense('Test', true));
      assert.throws(() => new Expense('Test', false));
      assert.throws(() => new Expense('Test', null));
      assert.throws(() => new Expense('Test', undefined));
      assert.throws(() => new Expense('Test'));
      assert.throws(() => new Expense('Test', NaN));
      assert.throws(() => new Expense('Test', [2]));
      assert.throws(() => new Expense('Test', [2, 3.4]));
      assert.throws(() => new Expense('Test', {amount: 2.45}));
    });

    it('should throw invalid date errors', function() {
      assert.throws(() => new Expense('Test', 2, '02/02/2017'));
      assert.throws(() => new Expense('Test', 2, 'Jun 15 2017'));
      assert.throws(() => new Expense('Test', 2, 'Feb 15 2017'));
      assert.throws(() => new Expense('Test', 2, '2017-13-01'));
      assert.throws(() => new Expense('Test', 2, '2017-02-29'));
      assert.throws(() => new Expense('Test', 2, '2017-04-31'));
      assert.throws(() => new Expense('Test', 2, '2017-04-00'));
      assert.throws(() => new Expense('Test', 2, '2017-01-00'));
      /* TODO: is year 0000 a thing?
      assert.throws(() => new Expense('Test', 2, '0000-12-01'));
      */
      assert.throws(() => new Expense('Test', 2, '2017-01-1'));
      assert.throws(() => new Expense('Test', 2, '2017-1-01'));
      assert.throws(() => new Expense('Test', 2, '2017-1-1'));
      assert.throws(() => new Expense('Test', 2, '17-01-01'));
      assert.throws(() => new Expense('Test', 2, '95-01-01'));
      assert.throws(() => new Expense('Test', 2, 10));
      assert.throws(() => new Expense('Test', 2, ['2017-01-01']));
      assert.throws(() => new Expense('Test', 2, {date: '2017-01-01'}));
    });

    it('should create a expense that has not been charged yet', function() {
      let expense = new Expense('Super cool expense', 1.54);
      assert.strictEqual(expense.name, 'Super cool expense');
      assert.strictEqual(expense.amount, 1.54);
      assert.strictEqual(expense.dateCharged, null);

      expense = new Expense('Another cool expense', 2.10);
      assert.strictEqual(expense.name, 'Another cool expense');
      assert.strictEqual(expense.amount, 2.10);
      assert.strictEqual(expense.dateCharged, null);

      expense = new Expense('Lunch', 6);
      assert.strictEqual(expense.name, 'Lunch');
      assert.strictEqual(expense.amount, 6);
      assert.strictEqual(expense.dateCharged, null);
    });

    it('should create a charged expense', function() {
      let expense = new Expense('First Test', 2, '2017-01-01');
      assert.strictEqual(expense.name, 'First Test');
      assert.strictEqual(expense.amount, 2);
      assert.strictEqual(expense.dateCharged, '2017-01-01');

      expense = new Expense('Second Test', 3, '2017-01-29');
      assert.strictEqual(expense.name, 'Second Test');
      assert.strictEqual(expense.amount, 3);
      assert.strictEqual(expense.dateCharged, '2017-01-29');

      expense = new Expense('Third Test', 4, '2017-01-02');
      assert.strictEqual(expense.name, 'Third Test');
      assert.strictEqual(expense.amount, 4);
      assert.strictEqual(expense.dateCharged, '2017-01-02');

      expense = new Expense('Fourth Test', 5, '2017-07-31');
      assert.strictEqual(expense.name, 'Fourth Test');
      assert.strictEqual(expense.amount, 5);
      assert.strictEqual(expense.dateCharged, '2017-07-31');

    });

  });

  describe('#charge()', function() {
    let expense;
    beforeEach(function() {
      expense = new Expense('Test Expense', 2.15)
    });
    afterEach(function() {
      expense = null
    });

    it('should charge the expense with the date', function() {
      expense.charge('2017-03-15');
      assert.strictEqual(expense.name, 'Test Expense');
      assert.strictEqual(expense.amount, 2.15);
      assert.strictEqual(expense.dateCharged, '2017-03-15');

      expense.charge('2017-02-15');
      assert.strictEqual(expense.name, 'Test Expense');
      assert.strictEqual(expense.amount, 2.15);
      assert.strictEqual(expense.dateCharged, '2017-02-15');

      expense.uncharge();
      assert.strictEqual(expense.name, 'Test Expense');
      assert.strictEqual(expense.amount, 2.15);
      assert.strictEqual(expense.dateCharged, null);

      expense.charge('2017-12-31');
      assert.strictEqual(expense.name, 'Test Expense');
      assert.strictEqual(expense.amount, 2.15);
      assert.strictEqual(expense.dateCharged, '2017-12-31');
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => expense.charge('02/02/2017'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('Jun 15 2017'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('Feb 15 2017'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-13-01'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-02-29'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-04-31'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-04-00'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-01-00'));
      assert.strictEqual(expense.dateCharged, null);
      /* TODO: is year 0000 a thing?
      assert.throws(() => expense.charge('0000-12-01'));
      */
      assert.throws(() => expense.charge('2017-01-1'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-1-01'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('2017-1-1'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('17-01-01'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge('95-01-01'));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge(null));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge(undefined));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge(NaN));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge(10));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge(['2017-01-01']));
      assert.strictEqual(expense.dateCharged, null);
      assert.throws(() => expense.charge({date: '2017-01-01'}));
      assert.strictEqual(expense.dateCharged, null);
    });

  });

  describe('#uncharge()', function() {
    let expense;
    beforeEach(function() {
      expense = new Expense('Test Expense', 2);
    });
    afterEach(function() {
      expense = null;
    });

    it('should set the date charged to null', function() {
      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);

      expense.charge('2017-02-01');
      assert.strictEqual(expense.dateCharged, '2017-02-01');

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);

      expense.charge('2017-01-01');
      assert.strictEqual(expense.dateCharged, '2017-01-01');

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);

      expense.charge('2017-10-25');
      assert.strictEqual(expense.dateCharged, '2017-10-25');

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
    });
  });

  describe('#charged()', function() {
    let expense;
    beforeEach(function() {
      expense = new Expense('Test Expense', 2);
    });
    afterEach(function() {
      expense = null;
    });

    it('should indicate whether the expense has been charged', function() {
      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
      assert.strictEqual(expense.charged(), false);

      expense.charge('2017-02-01');
      assert.strictEqual(expense.dateCharged, '2017-02-01');
      assert.strictEqual(expense.charged(), true);

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
      assert.strictEqual(expense.charged(), false);

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
      assert.strictEqual(expense.charged(), false);

      expense.charge('2017-01-01');
      assert.strictEqual(expense.dateCharged, '2017-01-01');
      assert.strictEqual(expense.charged(), true);

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
      assert.strictEqual(expense.charged(), false);

      expense.charge('2017-10-25');
      assert.strictEqual(expense.dateCharged, '2017-10-25');
      assert.strictEqual(expense.charged(), true);

      expense.uncharge();
      assert.strictEqual(expense.dateCharged, null);
      assert.strictEqual(expense.charged(), false);
    });
  });

  describe('database interaction helpers', function() {
    let expenseOne, expenseTwo, expenseThree;
    let docOne, docTwo, docThree;
    beforeEach(function() {
      expenseOne = new Expense('First Expense', 1);
      docOne = {
        name: 'First Expense',
        amount: 1,
        dateCharged: null,
        type: 'expense'
      };

      expenseTwo = new Expense('Second Expense', 2.54, '2016-12-31');
      docTwo = {
        name: 'Second Expense',
        amount: 2.54,
        dateCharged: [2016, 12, 31],
        type: 'expense'
      };

      expenseThree = new Expense('Third Expense', 2,'2017-04-01');
      docThree = {
        name: 'Third Expense',
        amount: 2,
        dateCharged: [2017, 4, 1],
        type: 'expense'
      };
    });
    afterEach(function() {
      expenseOne = expenseTwo = expenseThree = null;
      docOne = docTwo = docThree = null;
    });

    describe('#toDoc()', function() {
      it('should convert expenses to CouchDB friendly docs', function() {
        assert.deepStrictEqual(expenseOne.toDoc(), docOne);
        assert.deepStrictEqual(expenseTwo.toDoc(), docTwo);
        assert.deepStrictEqual(expenseThree.toDoc(), docThree);
      });
    });

    describe('#fromDoc()', function() {
      it('should convert CouchDB docs into expenses', function() {
        assert.deepStrictEqual(Expense.fromDoc(docOne), expenseOne);
        assert.deepStrictEqual(Expense.fromDoc(docTwo), expenseTwo);
        assert.deepStrictEqual(Expense.fromDoc(docThree), expenseThree);
      });
    });
  });

});
