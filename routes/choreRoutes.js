const Router = require('../modules/router');
const loader = require('../modules/dataLoader');
const helpers = require('../modules/routeHelpers');

const Chore = require('../modules/sharedLibs/chore');

let router = module.exports = new Router();

router.add('GET', /^\/all-chores$/, function (request, response) {
  helper.simpleGET(loader.allChores(), response);
});

router.add('GET', /^\/chore\/(\w+)$/, function (request, response, id) {
  if (!id) respondBadReq(response, 'request must contain chore ID in path');
  else simpleGET(loader.getChore(id), response);
});

router.add('PUT', /^\/chore$/, function (request, response) {
  console.log("calling put chore!");
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
