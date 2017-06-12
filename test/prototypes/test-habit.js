const assert = require('assert');
const Habit = require('../../modules/sharedLibs/habit');

describe('Habit', function() {

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
