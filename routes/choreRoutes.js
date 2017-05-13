const Router = require('../modules/router');
let router = module.exports = new Router();

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
