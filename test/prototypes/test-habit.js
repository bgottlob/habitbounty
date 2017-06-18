const assert = require('assert');
const Habit = require('../../modules/sharedLibs/habit');

describe('Habit', function() {

  describe('constructor', function() {
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

    // TODO: implement this stuff in habit to pass these tests
    it('should throw an invalid object error in the log', function() {
      assert.throws(() => new Habit('Test', 2, [{ amount: 2 }]));
      assert.throws(() => new Habit('Test', 2, [{ date: '03/01/2017' } ]));
      assert.throws(() => new Habit('Test', 2, [{
        date: '03/01/2017', reward: 2
      }]));
    });

    it('should throw an invalid log error', function() {
      assert.throws(() => new Habit('Test', 2, {}));
      assert.throws(() => new Habit('Test', 2, undefined));
      assert.throws(() => new Habit('Test', 2, null));
      assert.throws(() => new Habit('Test', 2, true));
      assert.throws(() => new Habit('Test', 2, false));
      assert.throws(() => new Habit('Test', 2, 'Log'));
      assert.throws(() => new Habit('Test', 2, 2));
      assert.throws(() => new Habit('Test', 2, NaN));
    });

    it('should throw an invalid date error in the log', function() {
    });

    it('should throw an invalid number error in the log', function() {
    });

    // TODO: Need a bunch of positive tests for logs
    // An empty log should be a positive test

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
