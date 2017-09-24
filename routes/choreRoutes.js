const Router = require('../modules/router');
const loader = require('../modules/dataLoader');

const helpers = require('../modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

const Chore = require('lib/chore');

let router = module.exports = new Router();

router.add('GET', /^\/all-chores$/, function (request, response) {
  simpleGET(loader.allChores(), response);
});

router.add('GET', /^\/chore\/(\w+)$/, function (request, response, id) {
  if (!id) respondBadReq(response, 'request must contain chore ID in path');
  else simpleGET(loader.getChore(id), response);
});

router.add('PUT', /^\/chore$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const chore = new Chore(body.name, body.amount);
    loader.createChore(chore).then(function(result) {
      return loader.getChore(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/complete-chore$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'date', 'set']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let chore = Chore.fromDoc(origDoc);
      if (body.set) chore.complete(body.date);
      else chore.uncomplete(body.date);
      return Object.assign(origDoc, chore.toDoc());
    }).then(function (result) {
      return Promise.all([loader.getChore(body.id), loader.balance()]);
    }).then(function (docs) {
      return response.end(JSON.stringify({
        chore: docs[0],
        balance: docs[1].balance
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/edit-chore$/, function (request, response) {
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
      let chore = Chore.fromDoc(origDoc);
      if (body.name) chore.name = body.name;
      if (body.amount) chore.amount = body.amount;
      return Object.assign(origDoc, chore.toDoc());
    }).then(function (result) {
      return loader.getChore(body.id);
    }).then(function (doc) {
      response.end(JSON.stringify(doc));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});
