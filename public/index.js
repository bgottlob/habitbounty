Array.prototype.isSame = function(other) {
  var acc = this.length == other.length;
  for (var i = 0; i < this.length; i++) {
    if (!acc) return acc;
    acc = acc && this[i] == other[i];
  }
  return acc;
};

/* Converts a Date object into a [year, month, day]. Note that months are
 * zero indexed to keep with standard set by JavaScript Date and moment */
Date.prototype.toLocalArray = function() {
  return [this.getFullYear(), this.getMonth(), this.getDate()]
};

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

var habitPromise = httpPromise('all-habits', 'GET', 'application/json')
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

var balancePromise = httpPromise('balance', 'GET', 'application/json')
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

Handlebars.registerHelper('isComplete', function(log) {
  /* TODO: Put habit isComplete function here */
  const todayArray = (new Date()).toLocalArray();
  var isComplete = log.reduce(function (acc, dateArray) {
    return acc || dateArray.isSame(todayArray);
  }, false);
  if (isComplete) return 'checked';
});

var promises = [ templatePromise, habitPromise, balancePromise ];

Promise.all(promises).then(function (values) {
  console.log('fulfilled all client side promises');
  var html = values[0]({
    habits: values[1],
    balance: values[2].amount
  });
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
      var set = true;
      if (event.currentTarget.hasAttribute('checked')) {
        event.currentTarget.removeAttribute('checked');
        set = false;
      }
      else {
        event.currentTarget.setAttribute('checked', '');
        set = true;
      }

      /* TODO: Import Date prototype toLocalArray function from habit.js */
      var today = new Date();
      var body = {
        id: habitId,
        set: set,
        date: [today.getFullYear(), today.getMonth(), today.getDate()]
      };
      event.target.disabled = true;
      httpPromise('complete-habit', 'POST', 'application/json', body)
        .then(function (response) {
          console.log(response);
          event.target.disabled = false;
        }).catch(function (err) {
          console.log(err);
          event.target.disabled = false;
          /* TODO: should the box be checked or unchecked if it fails? */
        });
      var balanceBody = {};
      if (set)
        balanceBody.changeAmt = Number(event.target.getAttribute('data-reward'));
      else
        balanceBody.changeAmt = -1 * Number(event.target.getAttribute('data-reward'));
      httpPromise('change-balance', 'POST', 'application/json', balanceBody)
        .then(function (response) {
          console.log(response);
          event.target.disabled = false;
        }).catch(function (err) {
          console.log(err);
          event.target.disabled = false;
          /* TODO: should the box be checked or unchecked if it fails? */
        });
    });
  }
}
