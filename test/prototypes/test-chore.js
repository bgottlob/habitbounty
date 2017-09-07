const assert = require('assert');
const Chore = require('../../modules/sharedLibs/chore');

describe('Chore', function() {

  describe('constructor', function() {
    // TODO: Add error types
    it('should throw invalid name errors', function() {
      assert.throws(() => new Chore(2, 2));
      assert.throws(() => new Chore(0, 2));
      assert.throws(() => new Chore(false, 2));
      assert.throws(() => new Chore(true, 2));
      assert.throws(() => new Chore(['chore name'], 2));
      assert.throws(() => new Chore(undefined, 2));
      assert.throws(() => new Chore(null, 2));
      assert.throws(() => new Chore(NaN, 2));
      assert.throws(() => new Chore({name:'chore name'}, 2));
    });

    it('should throw an invalid number error', function() {
      assert.throws(() => new Chore('Test', '2'));
      assert.throws(() => new Chore('Test', '2.4'));
      assert.throws(() => new Chore('Test', '2.41'));
      assert.throws(() => new Chore('Test', 2.411));
      assert.throws(() => new Chore('Test', 2.001));
      assert.throws(() => new Chore('Test', 2.0000000001));
      assert.throws(() => new Chore('Test', 2.0100000001));
      assert.throws(() => new Chore('Test', 'Test'));
      assert.throws(() => new Chore('Test', true));
      assert.throws(() => new Chore('Test', false));
      assert.throws(() => new Chore('Test', null));
      assert.throws(() => new Chore('Test', undefined));
      assert.throws(() => new Chore('Test'));
      assert.throws(() => new Chore('Test', NaN));
      assert.throws(() => new Chore('Test', [2]));
      assert.throws(() => new Chore('Test', [2, 3.4]));
      assert.throws(() => new Chore('Test', {amount: 2.45}));
    });

    it('should throw an invalid object error in the log', function() {
      assert.throws(() => new Chore('Test', 2, [{ amount: 2 }]));
      assert.throws(() => new Chore('Test', 2, [{ date: '2017-01-01' } ]));
      assert.throws(() => new Chore('Test', 2, [{
        date: '2017-03-01', reward: 2
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-03-01', extra: 'hi'
      }]));
      assert.throws(() => new Chore('Test', 2, [
        { amount: 2, date: '2017-03-02' },
        { amount: 2, date: '2017-03-03', extra: 'hi' },
        { amount: 2, date: '2017-03-01' }
      ]));
    });

    it('should throw an invalid log error', function() {
      assert.throws(() => new Chore('Test', 2, {}));
      assert.throws(() => new Chore('Test', 2, null));
      assert.throws(() => new Chore('Test', 2, true));
      assert.throws(() => new Chore('Test', 2, false));
      assert.throws(() => new Chore('Test', 2, 'Log'));
      assert.throws(() => new Chore('Test', 2, 2));
      assert.throws(() => new Chore('Test', 2, NaN));
    });

    it('should throw an invalid date error in the log', function() {
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '02/02/2017'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: 'Jun 15 2017'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: 'Feb 15 2017'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-13-01'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-02-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-04-31'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-04-00'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-01-00'
      }]));
      /* TODO: is year 0000 a thing?
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '0000-12-01'
      }]));
      */
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-01-1'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-1-01'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '2017-1-1'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '17-01-01'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2, date: '95-01-01'
      }]));
    });

    it('should throw an invalid number error in the log', function() {
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2.111111, date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: 2.001, date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: '2.00', date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: '2.0', date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: null, date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: undefined, date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [{
        amount: NaN, date: '2017-01-29'
      }]));
      assert.throws(() => new Chore('Test', 2, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' },
        { amount: 3.001, date: '2017-01-02' }
      ]));
      assert.throws(() => new Chore('Test', 2, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: '3', date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]));
    });

    it('should create a chore without a log', function() {
      let chore = new Chore('Super cool chore', 1.54);
      assert.strictEqual(chore.name, 'Super cool chore');
      assert.strictEqual(chore.amount, 1.54);
      assert.deepStrictEqual(chore.log, []);

      chore = new Chore('Another cool chore', 2.10);
      assert.strictEqual(chore.name, 'Another cool chore');
      assert.strictEqual(chore.amount, 2.10);
      assert.deepStrictEqual(chore.log, []);

      chore = new Chore('Take a shower', 6);
      assert.strictEqual(chore.name, 'Take a shower');
      assert.strictEqual(chore.amount, 6);
      assert.deepStrictEqual(chore.log, []);
    });

    it('should create a chore with the given log', function() {
      let chore = new Chore('First Test', 2, []);
      assert.strictEqual(chore.name, 'First Test');
      assert.strictEqual(chore.amount, 2);
      assert.deepStrictEqual(chore.log, []);

      chore = new Chore('Second Test', 3, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3, date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(chore.name, 'Second Test');
      assert.strictEqual(chore.amount, 3);
      assert.deepStrictEqual(chore.log, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3, date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]);

      chore = new Chore('Third Test', 2.01, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(chore.name, 'Third Test');
      assert.strictEqual(chore.amount, 2.01);
      assert.deepStrictEqual(chore.log, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);

      chore = new Chore('Fourth Test', 5.1, [
        { amount: 3.1, date: '2017-01-02' },
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(chore.name, 'Fourth Test');
      assert.strictEqual(chore.amount, 5.1);
      assert.deepStrictEqual(chore.log, [
        { amount: 3.1, date: '2017-01-02' },
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
    });

    // TODO: More tests
    //it('should eliminate duplicate date entries in the log only if they have the same reward')
    //it('should sort the log by date?')
    //it('should accept a leap year february date')

  });

  describe('#complete()', function() {
    let chore;
    beforeEach(function() {
      chore = new Chore('Test Chore', 2.15)
    });
    afterEach(function() {
      chore = null
    });

    it('should complete the chore with the given dates', function() {
      chore.complete('2017-03-15');
      assert.strictEqual(chore.name, 'Test Chore');
      assert.strictEqual(chore.amount, 2.15);
      assert.deepStrictEqual(chore.log, [{ amount: 2.15, date: '2017-03-15' }]);

      chore.complete('2017-02-15');
      assert.strictEqual(chore.name, 'Test Chore');
      assert.strictEqual(chore.amount, 2.15);
      assert.deepStrictEqual(chore.log, [
        { amount: 2.15, date: '2017-03-15' },
        { amount: 2.15, date: '2017-02-15' }
      ]);
    });

    it('should change entry amount when the amount of the chore changes',
      function() {
        // Normal case
        chore.complete('2017-03-15');
        assert.strictEqual(chore.name, 'Test Chore');
        assert.strictEqual(chore.amount, 2.15);
        assert.deepStrictEqual(chore.log, [{amount: 2.15, date: '2017-03-15'}]);

        // Change amount and then complete
        chore.amount = 4;
        chore.complete('2017-04-15');
        assert.strictEqual(chore.name, 'Test Chore');
        assert.strictEqual(chore.amount, 4);
        assert.deepStrictEqual(chore.log, [
          { amount: 2.15, date: '2017-03-15' },
          { amount: 4, date: '2017-04-15' }
        ]);
      }
    );

    // Test for completing for a date, then edit amount, then complete for the same date -- should not change anything on the second complete

    it('should ignore duplicate dates', function() {
      chore.complete('2017-03-15');
      assert.strictEqual(chore.name, 'Test Chore');
      assert.strictEqual(chore.amount, 2.15);
      assert.deepStrictEqual(chore.log, [{ amount: 2.15, date: '2017-03-15' }]);

      // Ignore duplicate dates
      chore.complete('2017-03-15');
      assert.strictEqual(chore.name, 'Test Chore');
      assert.strictEqual(chore.amount, 2.15);
      assert.deepStrictEqual(chore.log, [{ amount: 2.15, date: '2017-03-15' }]);

      // Ignore one more for good measures
      chore.complete('2017-03-15');
      assert.strictEqual(chore.name, 'Test Chore');
      assert.strictEqual(chore.amount, 2.15);
      assert.deepStrictEqual(chore.log, [{ amount: 2.15, date: '2017-03-15' }]);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => chore.complete('02/02/2017'));
      assert.throws(() => chore.complete('Jun 15 2017'));
      assert.throws(() => chore.complete('Feb 15 2017'));
      assert.throws(() => chore.complete('2017-13-01'));
      assert.throws(() => chore.complete('2017-02-29'));
      assert.throws(() => chore.complete('2017-04-31'));
      assert.throws(() => chore.complete('2017-04-00'));
      assert.throws(() => chore.complete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => chore.complete('0000-12-01'));
      */
      assert.throws(() => chore.complete('2017-01-1'));
      assert.throws(() => chore.complete('2017-1-01'));
      assert.throws(() => chore.complete('2017-1-1'));
      assert.throws(() => chore.complete('17-01-01'));
      assert.throws(() => chore.complete('95-01-01'));
    });
  });

  describe('#isComplete()', function() {
    let completedChore, incompleteChore;
    before(function() {
      completedChore = new Chore('Completed Chore', 2, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      incompleteChore = new Chore('Incomplete Chore', 2);
    });
    after(function() {
      completedChore = null;
      incompleteChore = null;
    });

    it('should find the chore is complete on the given dates', function() {
      assert.strictEqual(completedChore.isComplete('2017-01-01'), true);
      assert.strictEqual(completedChore.isComplete('2016-01-01'), true);
      assert.strictEqual(completedChore.isComplete('2017-03-15'), true);
      assert.strictEqual(completedChore.isComplete('2017-12-31'), true);
    });

    it('should find the chore is not complete on the given dates', function() {
      assert.strictEqual(incompleteChore.isComplete('2017-01-01'), false);
      assert.strictEqual(incompleteChore.isComplete('2016-01-01'), false);
      assert.strictEqual(incompleteChore.isComplete('2017-03-15'), false);
      assert.strictEqual(incompleteChore.isComplete('2017-12-31'), false);

      assert.strictEqual(completedChore.isComplete('2016-12-31'), false);
      assert.strictEqual(completedChore.isComplete('2016-02-01'), false);
      assert.strictEqual(completedChore.isComplete('2017-03-16'), false);
      assert.strictEqual(completedChore.isComplete('2017-12-30'), false);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => chore.isComplete('02/02/2017'));
      assert.throws(() => chore.isComplete('Jun 15 2017'));
      assert.throws(() => chore.isComplete('Feb 15 2017'));
      assert.throws(() => chore.isComplete('2017-13-01'));
      assert.throws(() => chore.isComplete('2017-02-29'));
      assert.throws(() => chore.isComplete('2017-04-31'));
      assert.throws(() => chore.isComplete('2017-04-00'));
      assert.throws(() => chore.isComplete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => chore.isComplete('0000-12-01'));
      */
      assert.throws(() => chore.isComplete('2017-01-1'));
      assert.throws(() => chore.isComplete('2017-1-01'));
      assert.throws(() => chore.isComplete('2017-1-1'));
      assert.throws(() => chore.isComplete('17-01-01'));
      assert.throws(() => chore.isComplete('95-01-01'));
    });
  });

  describe('#uncomplete()', function() {
    let completedChore, incompleteChore;
    beforeEach(function() {
      completedChore = new Chore('Completed Chore', 2, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      incompleteChore = new Chore('Incomplete Chore', 2);
    });
    afterEach(function() {
      completedChore = null;
      incompleteChore = null;
    });

    it('should remove log entries from the chore', function() {
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedChore.uncomplete('2017-03-15');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedChore.uncomplete('2017-12-31');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
      ]);
      completedChore.uncomplete('2017-01-01');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2016-01-01' }
      ]);
      completedChore.uncomplete('2016-01-01');
      assert.deepStrictEqual(completedChore.log, []);
    });

    it('should not remove log entries from the chore', function() {
      completedChore.uncomplete('2017-02-01');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedChore.uncomplete('2016-12-31');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedChore.uncomplete('2016-01-02');
      assert.deepStrictEqual(completedChore.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);

      incompleteChore.uncomplete('2017-02-01');
      assert.deepStrictEqual(incompleteChore.log, []);
      incompleteChore.uncomplete('2017-12-31');
      assert.deepStrictEqual(incompleteChore.log, []);
      incompleteChore.uncomplete('2017-01-02');
      assert.deepStrictEqual(incompleteChore.log, []);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => chore.uncomplete('02/02/2017'));
      assert.throws(() => chore.uncomplete('Jun 15 2017'));
      assert.throws(() => chore.uncomplete('Feb 15 2017'));
      assert.throws(() => chore.uncomplete('2017-13-01'));
      assert.throws(() => chore.uncomplete('2017-02-29'));
      assert.throws(() => chore.uncomplete('2017-04-31'));
      assert.throws(() => chore.uncomplete('2017-04-00'));
      assert.throws(() => chore.uncomplete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => chore.uncomplete('0000-12-01'));
      */
      assert.throws(() => chore.uncomplete('2017-01-1'));
      assert.throws(() => chore.uncomplete('2017-1-01'));
      assert.throws(() => chore.uncomplete('2017-1-1'));
      assert.throws(() => chore.uncomplete('17-01-01'));
      assert.throws(() => chore.uncomplete('95-01-01'));
    });
  });

  describe('database interaction helpers', function() {
    let choreOne, choreTwo, choreThree;
    let docOne, docTwo, docThree;
    beforeEach(function() {
      choreOne = new Chore('First Chore', 1);
      docOne = {
        name: 'First Chore',
        amount: 1,
        log: [],
        type: 'chore'
      };

      choreTwo = new Chore('Second Chore', 2.54, [
        { amount: 2.54, date: '2017-01-01' },
        { amount: 2.54, date: '2016-12-31' },
        { amount: 2.54, date: '2017-03-15' },
        { amount: 2.54, date: '2017-11-25' }
      ]);
      docTwo = {
        name: 'Second Chore',
        amount: 2.54,
        log: [
          { amount: 2.54, date: [2017, 1, 1] },
          { amount: 2.54, date: [2016, 12, 31] },
          { amount: 2.54, date: [2017, 3, 15] },
          { amount: 2.54, date: [2017, 11, 25] }
        ],
        type: 'chore'
      };

      choreThree = new Chore('Third Chore', 2, [
        { amount: 2.4, date: '2017-04-01' },
        { amount: 2.87, date: '2017-04-02' },
        { amount: 3, date: '2017-03-31' },
        { amount: 1, date: '2016-02-29' }
      ]);
      docThree = {
        name: 'Third Chore',
        amount: 2,
        log: [
          { amount: 2.4, date: [2017, 4, 1] },
          { amount: 2.87, date: [2017, 4, 2] },
          { amount: 3, date: [2017, 3, 31] },
          { amount: 1, date: [2016, 2, 29] }
        ],
        type: 'chore'
      };
    });
    afterEach(function() {
      choreOne = choreTwo = choreThree = null;
      docOne = docTwo = docThree = null;
    });

    describe('#toDoc()', function() {
      it('should convert chores to CouchDB friendly docs', function() {
        assert.deepStrictEqual(choreOne.toDoc(), docOne);
        assert.deepStrictEqual(choreTwo.toDoc(), docTwo);
        assert.deepStrictEqual(choreThree.toDoc(), docThree);
      });
    });

    describe('#fromDoc()', function() {
      it('should convert CouchDB docs into chores', function() {
        assert.deepStrictEqual(Chore.fromDoc(docOne), choreOne);
        assert.deepStrictEqual(Chore.fromDoc(docTwo), choreTwo);
        assert.deepStrictEqual(Chore.fromDoc(docThree), choreThree);
      });
    });
  });

});
