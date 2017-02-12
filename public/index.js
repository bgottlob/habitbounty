/* Client side code for index.html view */

/* ****** Setup for the three requests needed to initialize page ********
 * Error handling for parsing bad Handlebars template or JSON handled in
 * code that invokes these promises, no need to do it at this level */
function templatePromise() {
  return httpPromise('index.handlebars', 'GET', 'text/plain')
    .then(function (result) {
      return new Promise(function (fulfill, reject) {
        fulfill(Handlebars.compile(result));
      });
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function habitPromise() {
  return httpPromise('all-habits', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    }).catch(function (err) {
      return Promise.reject(err);
    });
}

function balancePromise() {
  return httpPromise('balance', 'GET', 'application/json')
    .then(function (result) {
      return Promise.resolve(JSON.parse(result));
    }).catch(function (err) {
      return Promise.reject(err);
    });
}
/****** End of setup for the three requests needed to initialize page ********/

/* Checks whether habit is complete; if so, check off its checkbox */
Handlebars.registerHelper('isComplete', function(obj) {
  if (habitFromObject(obj).isComplete(new Date().toLocalArray()))
    return 'checked';
});

/* Invoke the request promises needed to load the page */
function loadPage() {
  let promises = [ templatePromise(), habitPromise(), balancePromise() ];
  Promise.all(promises).then(function (values) {
    /* Build the HTML using the compiled Handlebars template with the habit
     * and balance data */
    let html = values[0]({
      habits: values[1],
      balance: values[2].amount
    });
    /* Create a div with the built HTML and append it to the HTML body */
    let div = document.createElement('div');
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);
    documentReady();
  }).catch(function (err) {
    /* Build error HTML and append to the body if any promise was rejected */
    let html = "<h2>Error</h2><p>Sorry, your content wan't found!</p>";
    let div = document.createElement('div');
    div.innerHTML = html;
    document.getElementsByTagName('body')[0].appendChild(div);
    console.log(err);
    console.log(err.stack);
  });
}

function reloadPage() {
  /* Deletes the div of generated content in the body, then reloads it all */
  let body = document.getElementsByTagName('body')[0]
  /* Find and remove all DIVs */
  for (let i = 0; i < body.childNodes.length; i++) {
    if (body.childNodes[i].nodeName === 'DIV') {
      body.removeChild(body.childNodes[i]);
    }
  }
  loadPage();
}

/* Load page initially */
loadPage();

/* Will only run once the handlebars template is filled out and the elements
 * have been loaded into the DOM */
function documentReady() {
  /* Event listeners for checkboxes */
  let editButtons = document.getElementsByClassName('editHabit');
  for (let i = 0; i < editButtons.length; i++) {
    editButtons[i].addEventListener('click', function (event) {
      let form = event.currentTarget.parentNode.querySelector('.editHabitForm');
      if (form.style.display === '')
        form.style.display = 'none';
      else
        form.style.display = '';
    });
  }

  let cancelButtons = document.getElementsByClassName('cancel');
  for (let i = 0; i < cancelButtons.length; i++) {
    cancelButtons[i].addEventListener('click', function (event) {
      event.preventDefault(); /* Prevent button from reloading page */
      event.currentTarget.parentNode.parentNode.style.display = 'none';
    });
  }

  document.getElementById('createHabit').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('createHabitForm').style.display = '';
    });

  let createHabitForm = document.getElementById('createHabitForm');
  createHabitForm.addEventListener('submit', function (event) {
    event.preventDefault();
    let body = {
      name: String(createHabitForm.name.value),
      reward: Number(createHabitForm.reward.value)
    };
    httpPromise('habit', 'PUT', 'application/json', body)
      .then(function (result) {
        createHabitForm.style.display = 'none';
        reloadPage();
      }).catch(function (err) {
        console.log(err);
      });
  });

  document.getElementById('changeBalance').addEventListener('click',
    function(event) {
      event.preventDefault();
      document.getElementById('balanceForm').style.display = '';
    });

  let balanceForm = document.getElementById('balanceForm');
  balanceForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let body = { changeAmt: Number(balanceForm.delta.value) };
    httpPromise('change-balance', 'POST', 'application/json', body)
      .then(function (result) {
        balanceForm.style.display = 'none';
        return balancePromise();
      }).then(function (result) {
        document.getElementById('balance').textContent = result.amount;
      }).catch(function (err) {
        console.log(err);
      });
  });

  let editHabitForms = document.getElementsByClassName('editHabitForm');
  for (let i = 0; i < editHabitForms.length; i++) {
    editHabitForms[i].addEventListener('submit', function (event) {
      let form = event.currentTarget;
      event.preventDefault();
      let body = {
        name: String(form.name.value),
        reward: Number(form.reward.value)
      };
      let habitId = form.dataset.habitid;
      httpPromise('edit-habit/' + habitId, 'POST', 'application/json', body)
        .then(function (result) {
          form.style.display = 'none';
          result = JSON.parse(result);
          let enclosingDiv = form.parentNode;
          enclosingDiv.querySelector('.nameLabel').textContent = result.name;
          enclosingDiv.querySelector('.rewardLabel').textContent = result.reward;
        }).catch(function (err) {
          console.log(err);
        });
    });
  }

  let deleteHabitButtons = document.getElementsByClassName('deleteHabit');
  for (let i = 0; i < deleteHabitButtons.length; i++) {
    deleteHabitButtons[i].addEventListener('click', function (event) {
      let button = event.currentTarget;
      /* TODO: Need defaults in httpPromise in case body is not provided */
      if (confirm("Are you sure you want to delete the habit?")) {
        httpPromise('delete-habit/' + button.dataset.habitid, 'DELETE', 'text/plain', {}).then(
          function(result) {
            console.log(result);
            reloadPage();
          }).catch(function (err) {
            console.log(err);
          });
      }
    });
  }

  /* Helper functions for dealing with checkboxes */
  function uncheck(checkbox) {
    checkbox.removeAttribute('checked');
  }

  function check(checkbox) {
    checkbox.setAttribute('checked', '');
  }

  function isChecked(checkbox) {
    return checkbox.hasAttribute('checked');
  }

  function toggleCheckbox(checkbox) {
    if (isChecked(checkbox))
      uncheck(checkbox);
    else
      check(checkbox);
  }

  let checkboxes = document.getElementsByClassName('completeHabit');
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("click", function(event) {
      const id = event.currentTarget.dataset.habitid;
      const rev = event.currentTarget.dataset.rev;
      cbox = event.currentTarget;
      toggleCheckbox(cbox);

      let body = {
        id: id,
        rev: rev,
        set: isChecked(cbox),
        date: new Date().toLocalArray()
      };

      /* Disable the checkbox once the habit is being changed */
      cbox.disabled = true;

      httpPromise('complete-habit', 'POST', 'application/json', body)
        .then(function (result) {
          /* (Un)completion successful! The current state of the checkbox
           * reflects the truth of what is in the database */
          result = JSON.parse(result);
          document.getElementById('balance').textContent = String(result.newBalance);
          cbox.dataset.rev = String(result.habitRev);
          cbox.disabled = false;
        }).catch(function (err) {
          /* Set the checkbox to be the opposite of what it has now, the habit's
           * completion was not toggled -- change the checkbox back */
          toggleCheckbox(cbox);
          cbox.disabled = false;
          console.log('Error occurred when trying to complete the habit');
          console.log(err);
        });
    });
  }
}
