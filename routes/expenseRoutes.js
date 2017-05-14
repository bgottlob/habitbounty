const Router = require('../modules/router');
const loader = require('../modules/dataLoader');

const helpers = require('../modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

const Expense = require('../modules/sharedLibs/expense');

let router = module.exports = new Router();

/* Return a list of all expenses in JSON for any client to consume */
router.add('GET', /^\/all-expenses$/, function (request, response) {
  simpleGET(loader.allExpenses(), response);
});

router.add('POST', /^\/charge-expense$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['id', 'rev', 'dateCharged']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    loader.updateDoc(body.id, body.rev, (origDoc) => {
      let expense = Expense.fromDoc(origDoc);
      if (body.dateCharged) expense.charge(body.dateCharged);
      else expense.uncharge();
      return Object.assign(origDoc, expense.toDoc());
    }).then(function(result) {
      /* Get latest updates */
      return Promise.all([loader.getExpense(body.id), loader.balance()]);
    }).then(function(result) {
      return response.end(JSON.stringify({
        expense: result[0],
        balance: result[1].balance
      }));
    }).catch(function(err) {
      console.log(err);
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
  }
});

router.add('POST', /^\/edit-expense/, function (request, response) {
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
      let expense = Expense.fromDoc(origDoc)
      if (body.name) expense.name = body.name;
      if (body.amount) expense.amount = body.amount;
      return Object.assign(origDoc, expense.toDoc());
    }).then(function (result) {
      /* This request can change the balance if the expense was completed and
       * its amount changed */
      return Promise.all([loader.getExpense(body.id), loader.balance()]);
    }).then(function (docs) {
      response.end(JSON.stringify({
        expense: docs[0],
        balance: docs[1]
      }));
    }).catch(function (err) {
      console.log(err);
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});

/* Creates a new expense */
router.add('PUT', /^\/expense$/, function (request, response) {
  const body = request.body;
  const invalidMsg = validateRequest(body, ['name', 'amount']);
  if (invalidMsg) {
    respondBadReq(response, invalidMsg);
  } else {
    const expense = new Expense(body.name, body.amount);
    loader.createExpense(expense).then(function(result) {
      return loader.getExpense(result.id);
    }).then(function (result) {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      response.end(JSON.stringify(err));
    });
  }
});
