let helpers = module.exports = {
  simpleGET: function(loaderPromise, response) {
    response.setHeader('Content-Type', 'application/json');
    loaderPromise.then(function (results) {
      response.end(JSON.stringify(results));
    }).catch(function (err) {
      response.statusCode = 404;
      response.end(JSON.stringify(err));
    });
  },
  respondBadReq: function(response, reason) {
    response.statusCode = 400;
    response.end(reason);
  },
  validateRequest: function(body, required, optional, moreFunc) {
    let invalidMsg = '';

    let all = [];
    if (required) all = all.concat(required);
    if (optional) all = all.concat(optional);

    let missing = required.filter((field) => {
      return typeof(body[field]) === 'undefined';
    });
    if (missing.length > 0)
      invalidMsg += 'the following fields are required in the request: ' + missing.join(', ') + '. ';

    let extras = Object.keys(body).filter((field) => {
      return all.indexOf(field) === -1
    });
    if (extras.length > 0)
      invalidMsg += 'the following fields are not allowed in the request: ' + extras.join(', ') + '. ';

    if (moreFunc) {
      moreMsg = moreFunc(body);
      if (moreMsg) invalidMsg += moreMsg;
    }

    if (invalidMsg === '') return false;
    else return invalidMsg;
  }

}
