const assert = require('assert');
const Task = require('../../modules/sharedLibs/task');

describe('Task', function() {

  describe('constructor', function() {
    // TODO: Add error types
    it('should throw invalid name errors', function() {
      assert.throws(() => new Task(2, 2));
      assert.throws(() => new Task(0, 2));
      assert.throws(() => new Task(false, 2));
      assert.throws(() => new Task(true, 2));
      assert.throws(() => new Task(['name'], 2));
      assert.throws(() => new Task(undefined, 2));
      assert.throws(() => new Task(null, 2));
      assert.throws(() => new Task(NaN, 2));
      assert.throws(() => new Task({name:'name'}, 2));
    });

    it('should throw an invalid number error', function() {
      assert.throws(() => new Task('Test', '2'));
      assert.throws(() => new Task('Test', '2.4'));
      assert.throws(() => new Task('Test', '2.41'));
      assert.throws(() => new Task('Test', 2.411));
      assert.throws(() => new Task('Test', 2.001));
      assert.throws(() => new Task('Test', 2.0000000001));
      assert.throws(() => new Task('Test', 2.0100000001));
      assert.throws(() => new Task('Test', 'Test'));
      assert.throws(() => new Task('Test', true));
      assert.throws(() => new Task('Test', false));
      assert.throws(() => new Task('Test', null));
      assert.throws(() => new Task('Test', undefined));
      assert.throws(() => new Task('Test'));
      assert.throws(() => new Task('Test', NaN));
      assert.throws(() => new Task('Test', [2]));
      assert.throws(() => new Task('Test', [2, 3.4]));
      assert.throws(() => new Task('Test', {amount: 2.45}));
    });

    it('should throw invalid date errors', function() {
      assert.throws(() => new Task('Test', 2, '02/02/2017'));
      assert.throws(() => new Task('Test', 2, 'Jun 15 2017'));
      assert.throws(() => new Task('Test', 2, 'Feb 15 2017'));
      assert.throws(() => new Task('Test', 2, '2017-13-01'));
      assert.throws(() => new Task('Test', 2, '2017-02-29'));
      assert.throws(() => new Task('Test', 2, '2017-04-31'));
      assert.throws(() => new Task('Test', 2, '2017-04-00'));
      assert.throws(() => new Task('Test', 2, '2017-01-00'));
      /* TODO: is year 0000 a thing?
      assert.throws(() => new Task('Test', 2, '0000-12-01'));
      */
      assert.throws(() => new Task('Test', 2, '2017-01-1'));
      assert.throws(() => new Task('Test', 2, '2017-1-01'));
      assert.throws(() => new Task('Test', 2, '2017-1-1'));
      assert.throws(() => new Task('Test', 2, '17-01-01'));
      assert.throws(() => new Task('Test', 2, '95-01-01'));
      assert.throws(() => new Task('Test', 2, 10));
      assert.throws(() => new Task('Test', 2, ['2017-01-01']));
      assert.throws(() => new Task('Test', 2, {date: '2017-01-01'}));
    });

    it('should create a task that has not been completed yet', function() {
      let task = new Task('Super cool task', 1.54);
      assert.strictEqual(task.name, 'Super cool task');
      assert.strictEqual(task.amount, 1.54);
      assert.strictEqual(task.dateCompleted, null);

      task = new Task('Another cool task', 2.10);
      assert.strictEqual(task.name, 'Another cool task');
      assert.strictEqual(task.amount, 2.10);
      assert.strictEqual(task.dateCompleted, null);

      task = new Task('Lunch', 6);
      assert.strictEqual(task.name, 'Lunch');
      assert.strictEqual(task.amount, 6);
      assert.strictEqual(task.dateCompleted, null);
    });

    it('should create a completed task', function() {
      let task = new Task('First Test', 2, '2017-01-01');
      assert.strictEqual(task.name, 'First Test');
      assert.strictEqual(task.amount, 2);
      assert.strictEqual(task.dateCompleted, '2017-01-01');

      task = new Task('Second Test', 3, '2017-01-29');
      assert.strictEqual(task.name, 'Second Test');
      assert.strictEqual(task.amount, 3);
      assert.strictEqual(task.dateCompleted, '2017-01-29');

      task = new Task('Third Test', 4, '2017-01-02');
      assert.strictEqual(task.name, 'Third Test');
      assert.strictEqual(task.amount, 4);
      assert.strictEqual(task.dateCompleted, '2017-01-02');

      task = new Task('Fourth Test', 5, '2017-07-31');
      assert.strictEqual(task.name, 'Fourth Test');
      assert.strictEqual(task.amount, 5);
      assert.strictEqual(task.dateCompleted, '2017-07-31');

    });

  });

  describe('#complete()', function() {
    let task;
    beforeEach(function() {
      task = new Task('Test Task', 2.15)
    });
    afterEach(function() {
      task = null
    });

    it('should complete the task with the date', function() {
      task.complete('2017-03-15');
      assert.strictEqual(task.name, 'Test Task');
      assert.strictEqual(task.amount, 2.15);
      assert.strictEqual(task.dateCompleted, '2017-03-15');

      task.complete('2017-02-15');
      assert.strictEqual(task.name, 'Test Task');
      assert.strictEqual(task.amount, 2.15);
      assert.strictEqual(task.dateCompleted, '2017-02-15');

      task.uncomplete();
      assert.strictEqual(task.name, 'Test Task');
      assert.strictEqual(task.amount, 2.15);
      assert.strictEqual(task.dateCompleted, null);

      task.complete('2017-12-31');
      assert.strictEqual(task.name, 'Test Task');
      assert.strictEqual(task.amount, 2.15);
      assert.strictEqual(task.dateCompleted, '2017-12-31');
    });

    it('should throw an invalid date error', function() {
      assert.throws(() => task.complete('02/02/2017'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('Jun 15 2017'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('Feb 15 2017'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-13-01'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-02-29'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-04-31'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-04-00'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-01-00'));
      assert.strictEqual(task.dateCompleted, null);
      /* TODO: is year 0000 a thing?
      assert.throws(() => task.complete('0000-12-01'));
      */
      assert.throws(() => task.complete('2017-01-1'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-1-01'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('2017-1-1'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('17-01-01'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete('95-01-01'));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete(null));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete(undefined));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete(NaN));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete(10));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete(['2017-01-01']));
      assert.strictEqual(task.dateCompleted, null);
      assert.throws(() => task.complete({date: '2017-01-01'}));
      assert.strictEqual(task.dateCompleted, null);
    });

  });

  describe('#uncomplete()', function() {
    let task;
    beforeEach(function() {
      task = new Task('Test Task', 2);
    });
    afterEach(function() {
      task = null;
    });

    it('should set the date completed to null', function() {
      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);

      task.complete('2017-02-01');
      assert.strictEqual(task.dateCompleted, '2017-02-01');

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);

      task.complete('2017-01-01');
      assert.strictEqual(task.dateCompleted, '2017-01-01');

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);

      task.complete('2017-10-25');
      assert.strictEqual(task.dateCompleted, '2017-10-25');

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
    });
  });

  describe('#charged()', function() {
    let task;
    beforeEach(function() {
      task = new Task('Test Task', 2);
    });
    afterEach(function() {
      task = null;
    });

    it('should indicate whether the task has been completed', function() {
      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
      assert.strictEqual(task.completed(), false);

      task.complete('2017-02-01');
      assert.strictEqual(task.dateCompleted, '2017-02-01');
      assert.strictEqual(task.completed(), true);

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
      assert.strictEqual(task.completed(), false);

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
      assert.strictEqual(task.completed(), false);

      task.complete('2017-01-01');
      assert.strictEqual(task.dateCompleted, '2017-01-01');
      assert.strictEqual(task.completed(), true);

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
      assert.strictEqual(task.completed(), false);

      task.complete('2017-10-25');
      assert.strictEqual(task.dateCompleted, '2017-10-25');
      assert.strictEqual(task.completed(), true);

      task.uncomplete();
      assert.strictEqual(task.dateCompleted, null);
      assert.strictEqual(task.completed(), false);
    });
  });

  describe('database interaction helpers', function() {
    let taskOne, taskTwo, taskThree;
    let docOne, docTwo, docThree;
    beforeEach(function() {
      taskOne = new Task('First Task', 1);
      docOne = {
        name: 'First Task',
        amount: 1,
        dateCompleted: null,
        type: 'task'
      };

      taskTwo = new Task('Second Task', 2.54, '2016-12-31');
      docTwo = {
        name: 'Second Task',
        amount: 2.54,
        dateCompleted: [2016, 12, 31],
        type: 'task'
      };

      taskThree = new Task('Third Task', 2,'2017-04-01');
      docThree = {
        name: 'Third Task',
        amount: 2,
        dateCompleted: [2017, 4, 1],
        type: 'task'
      };
    });
    afterEach(function() {
      taskOne = taskTwo = taskThree = null;
      docOne = docTwo = docThree = null;
    });

    describe('#toDoc()', function() {
      it('should convert tasks to CouchDB friendly docs', function() {
        assert.deepStrictEqual(taskOne.toDoc(), docOne);
        assert.deepStrictEqual(taskTwo.toDoc(), docTwo);
        assert.deepStrictEqual(taskThree.toDoc(), docThree);
      });
    });

    describe('#fromDoc()', function() {
      it('should convert CouchDB docs into tasks', function() {
        assert.deepStrictEqual(Task.fromDoc(docOne), taskOne);
        assert.deepStrictEqual(Task.fromDoc(docTwo), taskTwo);
        assert.deepStrictEqual(Task.fromDoc(docThree), taskThree);
      });
    });
  });

});
