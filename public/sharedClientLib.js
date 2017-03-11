/* Functions that are shared among multiple pages on the client side */
function httpPromise(url, method, mimeType, body) {
  return new Promise(function (fulfill, reject) {
    var request = new XMLHttpRequest();
    request.open(method, url);
    request.onreadystatechange = function() {
      try {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            fulfill(request.response);
          }
          else {
            /* Status code indicated an unsuccessful request */
            reject(new Error('Request came back with status code '
              + request.status));
          }
        }
      } catch (err) {
        /* The server went down */
        reject(err);
      }
    };
    if (mimeType) request.overrideMimeType(mimeType);
    if (body)
      request.send(JSON.stringify(body));
    else
      request.send();
  });
}

function habitFromObject(obj) {
  return new Habit(obj.name, obj.reward, obj.log);
}
function expenseFromObject(obj) {
  return new Expense(obj.name, obj.amount, obj.dateCharged);
}
