const Router = require('../modules/router');
const loader = require('../modules/dataLoader');

const helpers = require('../modules/routeHelpers');
const simpleGET = helpers.simpleGET;
const respondBadReq = helpers.respondBadReq;
const validateRequest = helpers.validateRequest;

const Balance = require('lib/balance');

let router = module.exports = new Router();

/* Get the info for the balance */
router.add('GET', /^\/balance$/, function (request, response) {
  simpleGET(loader.balance(), response);
});

/* TODO: FIX THIS -- A REV MUST BE USED HERE TO CONTROL CONCURRENCY */
router.add('POST', /^\/change-balance$/, function (request, response) {
  const body = request.body;
  console.log(body);
  const invalidMsg = validateRequest(body, ['amount'], null, (b) => {
    if (isNaN(b.amount)) return 'amount must be a valid number';
  });
  if (invalidMsg) {
    console.log('it is invalid!!!!');
    respondBadReq(response, invalidMsg);
  } else {
    loader.getDoc('balance').then(function (doc) {
      const changeAmt = Number(body.amount);
      let balance = new Balance(doc.log);
      balance.changeAmountBy(changeAmt);
      return loader.updateDoc(Object.assign(doc, balance.toDoc()));
    }).then(function (result) {
      return loader.balance();
    }).then(function (result) {
      return response.end(JSON.stringify(result));
    }).catch(function (err) {
      response.statusCode = 400;
      return response.end(JSON.stringify(err));
    });
  }
});
