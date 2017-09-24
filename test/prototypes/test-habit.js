const assert = require('assert');
const Habit = require('lib/habit');

describe('Habit', function() {

  describe('constructor', function() {
    // TODO: Add error types
    it('should throw invalid name errors', function() {
      assert.throws(() => new Habit(2, 2));
      assert.throws(() => new Habit(0, 2));
      assert.throws(() => new Habit(false, 2));
      assert.throws(() => new Habit(true, 2));
      assert.throws(() => new Habit(['habit name'], 2));
      assert.throws(() => new Habit(undefined, 2));
      assert.throws(() => new Habit(null, 2));
      assert.throws(() => new Habit(NaN, 2));
      assert.throws(() => new Habit({name:'habit name'}, 2));
    });

    it('should throw an invalid number error', function() {
      assert.throws(() => new Habit('Test', '2'));
      assert.throws(() => new Habit('Test', '2.4'));
      assert.throws(() => new Habit('Test', '2.41'));
      assert.throws(() => new Habit('Test', 2.411));
      assert.throws(() => new Habit('Test', 2.001));
      assert.throws(() => new Habit('Test', 2.0000000001));
      assert.throws(() => new Habit('Test', 2.0100000001));
      assert.throws(() => new Habit('Test', 'Test'));
      assert.throws(() => new Habit('Test', true));
      assert.throws(() => new Habit('Test', false));
      assert.throws(() => new Habit('Test', null));
      assert.throws(() => new Habit('Test', undefined));
      assert.throws(() => new Habit('Test'));
      assert.throws(() => new Habit('Test', NaN));
      assert.throws(() => new Habit('Test', [2]));
      assert.throws(() => new Habit('Test', [2, 3.4]));
      assert.throws(() => new Habit('Test', {amount: 2.45}));
    });

    it('should throw an invalid object error in the log', function() {
      assert.throws(() => new Habit('Test', 2, [{ amount: 2 }]));
      assert.throws(() => new Habit('Test', 2, [{ date: '2017-01-01' } ]));
      assert.throws(() => new Habit('Test', 2, [{
        date: '2017-03-01', reward: 2
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-03-01', extra: 'hi'
      }]));
      assert.throws(() => new Habit('Test', 2, [
        { amount: 2, date: '2017-03-02' },
        { amount: 2, date: '2017-03-03', extra: 'hi' },
        { amount: 2, date: '2017-03-01' }
      ]));
    });

    it('should throw an invalid log error', function() {
      assert.throws(() => new Habit('Test', 2, {}));
      assert.throws(() => new Habit('Test', 2, null));
      assert.throws(() => new Habit('Test', 2, true));
      assert.throws(() => new Habit('Test', 2, false));
      assert.throws(() => new Habit('Test', 2, 'Log'));
      assert.throws(() => new Habit('Test', 2, 2));
      assert.throws(() => new Habit('Test', 2, NaN));
    });

    it('should throw an invalid date error in the log', function() {
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '02/02/2017'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: 'Jun 15 2017'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: 'Feb 15 2017'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-13-01'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-02-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-04-31'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-04-00'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-01-00'
      }]));
      /* TODO: is year 0000 a thing?
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '0000-12-01'
      }]));
      */
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-01-1'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-1-01'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '2017-1-1'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '17-01-01'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2, date: '95-01-01'
      }]));
    });

    it('should throw an invalid number error in the log', function() {
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2.111111, date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: 2.001, date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: '2.00', date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: '2.0', date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: null, date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: undefined, date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [{
        amount: NaN, date: '2017-01-29'
      }]));
      assert.throws(() => new Habit('Test', 2, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' },
        { amount: 3.001, date: '2017-01-02' }
      ]));
      assert.throws(() => new Habit('Test', 2, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: '3', date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]));
    });

    it('should create a habit without a log', function() {
      let habit = new Habit('Super cool habit', 1.54);
      assert.strictEqual(habit.name, 'Super cool habit');
      assert.strictEqual(habit.amount, 1.54);
      assert.deepStrictEqual(habit.log, []);

      habit = new Habit('Another cool habit', 2.10);
      assert.strictEqual(habit.name, 'Another cool habit');
      assert.strictEqual(habit.amount, 2.10);
      assert.deepStrictEqual(habit.log, []);

      habit = new Habit('Take a shower', 6);
      assert.strictEqual(habit.name, 'Take a shower');
      assert.strictEqual(habit.amount, 6);
      assert.deepStrictEqual(habit.log, []);
    });

    it('should create a habit with the given log', function() {
      let habit = new Habit('First Test', 2, []);
      assert.strictEqual(habit.name, 'First Test');
      assert.strictEqual(habit.amount, 2);
      assert.deepStrictEqual(habit.log, []);

      habit = new Habit('Second Test', 3, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3, date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(habit.name, 'Second Test');
      assert.strictEqual(habit.amount, 3);
      assert.deepStrictEqual(habit.log, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3, date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]);

      habit = new Habit('Third Test', 2.01, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(habit.name, 'Third Test');
      assert.strictEqual(habit.amount, 2.01);
      assert.deepStrictEqual(habit.log, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);

      habit = new Habit('Fourth Test', 5.1, [
        { amount: 3.1, date: '2017-01-02' },
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]);
      assert.strictEqual(habit.name, 'Fourth Test');
      assert.strictEqual(habit.amount, 5.1);
      assert.deepStrictEqual(habit.log, [
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
    let habit;
    beforeEach(function() {
      habit = new Habit('Test Habit', 2.15)
    });
    afterEach(function() {
      habit = null
    });

    it('should complete the habit with the given dates', function() {
      habit.complete('2017-03-15');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '2017-03-15' }]);

      habit.complete('2017-02-15');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [
        { amount: 2.15, date: '2017-03-15' },
        { amount: 2.15, date: '2017-02-15' }
      ]);
    });

    it('should change entry amount when the amount of the habit changes',
      function() {
        // Normal case
        habit.complete('2017-03-15');
        assert.strictEqual(habit.name, 'Test Habit');
        assert.strictEqual(habit.amount, 2.15);
        assert.deepStrictEqual(habit.log, [{amount: 2.15, date: '2017-03-15'}]);

        // Change amount and then complete
        habit.amount = 4;
        habit.complete('2017-04-15');
        assert.strictEqual(habit.name, 'Test Habit');
        assert.strictEqual(habit.amount, 4);
        assert.deepStrictEqual(habit.log, [
          { amount: 2.15, date: '2017-03-15' },
          { amount: 4, date: '2017-04-15' }
        ]);
      }
    );

    // Test for completing for a date, then edit amount, then complete for the same date -- should not change anything on the second complete

    it('should ignore duplicate dates', function() {
      habit.complete('2017-03-15');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '2017-03-15' }]);

      // Ignore duplicate dates
      habit.complete('2017-03-15');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '2017-03-15' }]);

      // Ignore one more for good measures
      habit.complete('2017-03-15');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '2017-03-15' }]);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => habit.complete('02/02/2017'));
      assert.throws(() => habit.complete('Jun 15 2017'));
      assert.throws(() => habit.complete('Feb 15 2017'));
      assert.throws(() => habit.complete('2017-13-01'));
      assert.throws(() => habit.complete('2017-02-29'));
      assert.throws(() => habit.complete('2017-04-31'));
      assert.throws(() => habit.complete('2017-04-00'));
      assert.throws(() => habit.complete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => habit.complete('0000-12-01'));
      */
      assert.throws(() => habit.complete('2017-01-1'));
      assert.throws(() => habit.complete('2017-1-01'));
      assert.throws(() => habit.complete('2017-1-1'));
      assert.throws(() => habit.complete('17-01-01'));
      assert.throws(() => habit.complete('95-01-01'));
    });
  });

  describe('#isComplete()', function() {
    let completedHabit, incompleteHabit;
    before(function() {
      completedHabit = new Habit('Completed Habit', 2, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      incompleteHabit = new Habit('Incomplete Habit', 2);
    });
    after(function() {
      completedHabit = null;
      incompleteHabit = null;
    });

    it('should find the habit is complete on the given dates', function() {
      assert.strictEqual(completedHabit.isComplete('2017-01-01'), true);
      assert.strictEqual(completedHabit.isComplete('2016-01-01'), true);
      assert.strictEqual(completedHabit.isComplete('2017-03-15'), true);
      assert.strictEqual(completedHabit.isComplete('2017-12-31'), true);
    });

    it('should find the habit is not complete on the given dates', function() {
      assert.strictEqual(incompleteHabit.isComplete('2017-01-01'), false);
      assert.strictEqual(incompleteHabit.isComplete('2016-01-01'), false);
      assert.strictEqual(incompleteHabit.isComplete('2017-03-15'), false);
      assert.strictEqual(incompleteHabit.isComplete('2017-12-31'), false);

      assert.strictEqual(completedHabit.isComplete('2016-12-31'), false);
      assert.strictEqual(completedHabit.isComplete('2016-02-01'), false);
      assert.strictEqual(completedHabit.isComplete('2017-03-16'), false);
      assert.strictEqual(completedHabit.isComplete('2017-12-30'), false);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => habit.isComplete('02/02/2017'));
      assert.throws(() => habit.isComplete('Jun 15 2017'));
      assert.throws(() => habit.isComplete('Feb 15 2017'));
      assert.throws(() => habit.isComplete('2017-13-01'));
      assert.throws(() => habit.isComplete('2017-02-29'));
      assert.throws(() => habit.isComplete('2017-04-31'));
      assert.throws(() => habit.isComplete('2017-04-00'));
      assert.throws(() => habit.isComplete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => habit.isComplete('0000-12-01'));
      */
      assert.throws(() => habit.isComplete('2017-01-1'));
      assert.throws(() => habit.isComplete('2017-1-01'));
      assert.throws(() => habit.isComplete('2017-1-1'));
      assert.throws(() => habit.isComplete('17-01-01'));
      assert.throws(() => habit.isComplete('95-01-01'));
    });
  });

  describe('#uncomplete()', function() {
    let completedHabit, incompleteHabit;
    beforeEach(function() {
      completedHabit = new Habit('Completed Habit', 2, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      incompleteHabit = new Habit('Incomplete Habit', 2);
    });
    afterEach(function() {
      completedHabit = null;
      incompleteHabit = null;
    });

    it('should remove log entries from the habit', function() {
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedHabit.uncomplete('2017-03-15');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedHabit.uncomplete('2017-12-31');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
      ]);
      completedHabit.uncomplete('2017-01-01');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2016-01-01' }
      ]);
      completedHabit.uncomplete('2016-01-01');
      assert.deepStrictEqual(completedHabit.log, []);
    });

    it('should not remove log entries from the habit', function() {
      completedHabit.uncomplete('2017-02-01');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedHabit.uncomplete('2016-12-31');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);
      completedHabit.uncomplete('2016-01-02');
      assert.deepStrictEqual(completedHabit.log, [
        { amount: 2, date: '2017-01-01' },
        { amount: 2, date: '2016-01-01' },
        { amount: 2, date: '2017-03-15' },
        { amount: 2, date: '2017-12-31' }
      ]);

      incompleteHabit.uncomplete('2017-02-01');
      assert.deepStrictEqual(incompleteHabit.log, []);
      incompleteHabit.uncomplete('2017-12-31');
      assert.deepStrictEqual(incompleteHabit.log, []);
      incompleteHabit.uncomplete('2017-01-02');
      assert.deepStrictEqual(incompleteHabit.log, []);
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => habit.uncomplete('02/02/2017'));
      assert.throws(() => habit.uncomplete('Jun 15 2017'));
      assert.throws(() => habit.uncomplete('Feb 15 2017'));
      assert.throws(() => habit.uncomplete('2017-13-01'));
      assert.throws(() => habit.uncomplete('2017-02-29'));
      assert.throws(() => habit.uncomplete('2017-04-31'));
      assert.throws(() => habit.uncomplete('2017-04-00'));
      assert.throws(() => habit.uncomplete('2017-01-00'));
      /* TODO: Find out if year 0000 is a thing
      assert.throws(() => habit.uncomplete('0000-12-01'));
      */
      assert.throws(() => habit.uncomplete('2017-01-1'));
      assert.throws(() => habit.uncomplete('2017-1-01'));
      assert.throws(() => habit.uncomplete('2017-1-1'));
      assert.throws(() => habit.uncomplete('17-01-01'));
      assert.throws(() => habit.uncomplete('95-01-01'));
    });
  });

  describe('database interaction helpers', function() {
    let habitOne, habitTwo, habitThree;
    let docOne, docTwo, docThree;
    beforeEach(function() {
      habitOne = new Habit('First Habit', 1);
      docOne = {
        name: 'First Habit',
        amount: 1,
        log: [],
        type: 'habit'
      };

      habitTwo = new Habit('Second Habit', 2.54, [
        { amount: 2.54, date: '2017-01-01' },
        { amount: 2.54, date: '2016-12-31' },
        { amount: 2.54, date: '2017-03-15' },
        { amount: 2.54, date: '2017-11-25' }
      ]);
      docTwo = {
        name: 'Second Habit',
        amount: 2.54,
        log: [
          { amount: 2.54, date: [2017, 1, 1] },
          { amount: 2.54, date: [2016, 12, 31] },
          { amount: 2.54, date: [2017, 3, 15] },
          { amount: 2.54, date: [2017, 11, 25] }
        ],
        type: 'habit'
      };

      habitThree = new Habit('Third Habit', 2, [
        { amount: 2.4, date: '2017-04-01' },
        { amount: 2.87, date: '2017-04-02' },
        { amount: 3, date: '2017-03-31' },
        { amount: 1, date: '2016-02-29' }
      ]);
      docThree = {
        name: 'Third Habit',
        amount: 2,
        log: [
          { amount: 2.4, date: [2017, 4, 1] },
          { amount: 2.87, date: [2017, 4, 2] },
          { amount: 3, date: [2017, 3, 31] },
          { amount: 1, date: [2016, 2, 29] }
        ],
        type: 'habit'
      };
    });
    afterEach(function() {
      habitOne = habitTwo = habitThree = null;
      docOne = docTwo = docThree = null;
    });

    describe('#toDoc()', function() {
      it('should convert habits to CouchDB friendly docs', function() {
        assert.deepStrictEqual(habitOne.toDoc(), docOne);
        assert.deepStrictEqual(habitTwo.toDoc(), docTwo);
        assert.deepStrictEqual(habitThree.toDoc(), docThree);
      });
    });

    describe('#fromDoc()', function() {
      it('should convert CouchDB docs into habits', function() {
        assert.deepStrictEqual(Habit.fromDoc(docOne), habitOne);
        assert.deepStrictEqual(Habit.fromDoc(docTwo), habitTwo);
        assert.deepStrictEqual(Habit.fromDoc(docThree), habitThree);
      });
    });
  });

});
