/* Client side code for index.html view */
var templatePromise = httpPromise('index.handlebars', 'GET', 'text/plain')
  .then(function (response) {
    return new Promise(function (fulfill, reject) {
      /* TODO: probably should be catching errors for bad handlebars syntax
       * and context compilation */
      fulfill(Handlebars.compile(response));
    });
  }).catch(function (err) {
    return Promise.reject(err);
  });

var contextPromise = httpPromise('all-habits', 'GET', 'application/json')
  .then(function (response) {
    return new Promise(function (fulfill, reject) {
      try {
        fulfill(JSON.parse(response));
      } catch (err) {
        reject(err);
      }
    });
  }).catch(function (err) {
    return Promise.reject(err);
  });

var promises = [ templatePromise, contextPromise ];

Promise.all(promises).then(function (values) {
  var html = values[0](values[1]);
  var div = document.createElement('div');
  div.innerHTML = html;
  document.getElementsByTagName('body')[0].appendChild(div);
  documentReady();
}).catch(function (err) {
  var html = "<h2>Error</h2><p>Sorry, your content wan't found!</p>";
  var div = document.createElement('div');
  div.innerHTML = html;
  document.getElementsByTagName('body')[0].appendChild(div);
  console.log(err);
});

/* TODO: Add some post-processing function argument here? */
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

/* Will only run once the handlebars template is filled out and the elements
 * have been loaded into the DOM */
function documentReady() {
  /* Event listeners for checkboxes */
  var checkboxes = document.getElementsByClassName('completeHabit');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("click", function(event) {
      const habitId = event.currentTarget.getAttribute('value');
      event.currentTarget.disabled = true;
      /* TODO: Import Date prototype toLocalArray function from habit.js */
      var today = new Date();
      var reqBody = {
        id: habitId,
        date: [today.getFullYear(), today.getMonth(), today.getDate()]
      };
      httpPromise('complete-habit', 'POST', 'application/json', reqBody)
        .then(function (response) {
          console.log('All good in the hood');
          console.log(response);
        }).catch(function (err) {
          console.log('Houston we have a problem');
          console.log(err);
        });
    });
  }
}
