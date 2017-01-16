/* Client side code for index.html view */
function templatePromise() {
  return httpPromise('index.handlebars', 'GET', 'text/plain')
    .then(function (response) {
      return new Promise(function (fulfill, reject) {
        /* TODO: probably should be catching errors for bad handlebars syntax
         * and context compilation */
        fulfill(Handlebars.compile(response));
      });
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function habitPromise() {
  return httpPromise('all-habits', 'GET', 'application/json')
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
}

function balancePromise() {
  return httpPromise('balance', 'GET', 'application/json')
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
}

Handlebars.registerHelper('isComplete', function(obj) {
  if (habitFromObject(obj).isComplete(new Date().toLocalArray()))
    return 'checked';
});

var promises = [ templatePromise(), habitPromise(), balancePromise() ];

Promise.all(promises).then(function (values) {
  console.log('all came back!');
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
  console.log(err.stack);
});

/* TODO: wrap toggling a checkbox into a shared client side function */

/* Will only run once the handlebars template is filled out and the elements
 * have been loaded into the DOM */
function documentReady() {
  /* Event listeners for checkboxes */
  var editButtons = document.getElementsByClassName('editHabit');
  for (var i = 0; i < editButtons.length; i++) {
    editButtons[i].addEventListener('click', function (event) {
      var form = event.currentTarget.nextElementSibling;
      if (form.style.display === '')
        form.style.display = 'none';
      else
        form.style.display = '';
    });
  }

  var cancelButtons = document.getElementsByClassName('cancel');
  for (var i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', function (event) {
      event.preventDefault(); /* Prevent button from reloading page */
      event.currentTarget.parentNode.parentNode.style.display = 'none';
    });
  }

  /*
  var forms = document.getElementsByClassName('form');
  for (var i = 0; i < forms.length; i++) {
    forms[i].addEventListener('submit', function (event) {
      event.preventDefault();
    });
  }
  */

  var submitButtons = document.getElementsByClassName('submitHabit');
  for (var i = 0; i < submitButtons.length; i++) {
    submitButtons[i].addEventListener('click', function (event) {
      event.preventDefault();
      var form = event.currentTarget.parentNode.parentNode;
      console.log(form);
      console.log(form.dataset.habitid);
      var habitId = form.dataset.habitid;
      var body = {};
      body.name = form.querySelector('.nameField').value;
      body.reward = form.querySelector('.rewardField').value;
      console.log(body);
      httpPromise('edit-habit/' + habitId, 'POST', 'application/json', body)
        .then(function (result) {
          form.style.display = 'none';
          console.log('updated habit!!');
        }).catch(function (err) {
          console.log(err)
        });
    });
  }

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

      var body = {
        id: habitId,
        set: set,
        date: new Date().toLocalArray()
      };

      /* Disable the checkbox once the habit is being changed */
      event.target.disabled = true;

      httpPromise('complete-habit', 'POST', 'application/json', body)
        .then(function (result) {
          result = JSON.parse(result);
          document.getElementById('balance').innerHTML = String(result.newBalance);
          if (result.completed)
            event.target.setAttribute('checked', '');
          else
            event.target.removeAttribute('checked');

          event.target.disabled = false;
        }).catch(function (err) {
          console.log('Error occurred when trying to complete the habit');
          event.target.disabled = false;
          /* Set the checkbox to be the opposite of what it has now, the habit's
           * completion was not toggled */
          if (event.target.hasAttribute('checked'))
            event.target.removeAttribute('checked');
          else
            event.target.setAttribute('checked', '');

          event.target.disabled = false;
        });
    });
  }
}
