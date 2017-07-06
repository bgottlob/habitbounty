const assert = require('assert');
const Habit = require('../../modules/sharedLibs/habit');

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

    // TODO: Need a bunch of positive tests for logs
    // An empty log should be a positive test
    it('should create a habit with the given log', function() {
      assert.doesNotThrow(() => new Habit('Test', 2, []));
      assert.doesNotThrow(() => new Habit('Test', 2, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3, date: '2017-01-02' },
        { amount: 3.21, date: '2017-01-01' }
      ]));
      assert.doesNotThrow(() => new Habit('Test', 2.01, [
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]));
      assert.doesNotThrow(() => new Habit('Test', 2.01, []));
      assert.doesNotThrow(() => new Habit('Test', 2, [
        { amount: 3.1, date: '2017-01-02' },
        { amount: 2.20, date: '2017-01-29' },
        { amount: 3.21, date: '2017-01-01' }
      ]));
    });

    // TODO: More tests
    //it('should eliminate duplicate date entries in the log only if they have the same reward')
    //it('should sort the log by date?')
    //it('should accept a leap year february date')

  });

  describe('#complete()', function() {
    let habit;

    // Creates a test habit
    beforeEach(function() {
      habit = new Habit('Test Habit', 2.15)
    });


    it('should complete the habit with the given dates', function() {
      habit.complete('03-15-2017');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '03-15-2017' }]);

      habit.complete('02-15-2017');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [
        { amount: 2.15, date: '03-15-2017' },
        { amount: 2.15, date: '02-15-2017' }
      ]);
    });

    it('should change entry amount when the amount of the habit changes',
      function() {
        // Normal case
        habit.complete('03-15-2017');
        assert.strictEqual(habit.name, 'Test Habit');
        assert.strictEqual(habit.amount, 2.15);
        assert.deepStrictEqual(habit.log, [{amount: 2.15, date: '03-15-2017'}]);

        // Change amount and then complete
        habit.amount = 4;
        habit.complete('04-15-2017');
        assert.strictEqual(habit.name, 'Test Habit');
        assert.strictEqual(habit.amount, 4);
        assert.deepStrictEqual(habit.log, [
          { amount: 2.15, date: '03-15-2017' },
          { amount: 4, date: '04-15-2017' }
        ]);
      }
    );

    // Test for completing for a date, then edit amount, then complete for the same date -- should not change anything on the second complete

    it('should ignore duplicate dates', function() {
      habit.complete('03-15-2017');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '03-15-2017' }]);

      // Ignore duplicate dates
      habit.complete('03-15-2017');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '03-15-2017' }]);

      // Ignore one more for good measures
      habit.complete('03-15-2017');
      assert.strictEqual(habit.name, 'Test Habit');
      assert.strictEqual(habit.amount, 2.15);
      assert.deepStrictEqual(habit.log, [{ amount: 2.15, date: '03-15-2017' }]);
    });

    afterEach(function() {
      habit = null
    });

  });

});
