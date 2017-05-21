const Router = require('../modules/router');
const loader = require('../modules/dataLoader');

const helpers = require('../modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

const Task = require('../modules/sharedLibs/task');

let router = module.exports = new Router();

router.add('GET', /^\/all-tasks$/, function (request, response) {
  simpleGET(loader.allTasks(), response);
});

router.add('POST', /^\/complete-task$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'dateCompleted']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let task = Task.fromDoc(origDoc);
      if (body.dateCompleted) task.complete(body.dateCompleted);
      else task.uncomplete();
      return Object.assign(origDoc, task.toDoc());
    }).then(function(result) {
      return Promise.all([loader.getTask(body.id), loader.balance()]);
    }).then(function(result) {
      return response.end(JSON.stringify({
        task: result[0],
        balance: result[1].balance
      }));
    }).catch(function(err) {
      console.log(err);
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/edit-task$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev'], ['name', 'amount'],
    (b) => {
      if (typeof(b.name) === 'undefined' && typeof(b.amount) === 'undefined')
        return 'either name, amount, or both must be provided';
    }
  );
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let task = Task.fromDoc(origDoc)
      if (body.name) task.name = body.name;
      if (body.amount) task.amount = body.amount;
      return Object.assign(origDoc, task.toDoc());
    }).then(function (result) {
      // This request can change the balance if the task was completed and
      // its amount changed
      return Promise.all([loader.getTask(body.id), loader.balance()]);
    }).then(function (docs) {
      response.end(JSON.stringify({
        task: docs[0],
        balance: docs[1]
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

router.add('PUT', /^\/task$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const task = new Task(body.name, body.amount);
    loader.createTask(task).then(function(result) {
      return loader.getTask(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});
