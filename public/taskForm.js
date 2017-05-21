function refreshTask(oldDiv, taskContent) {
  let newDivParent = document.createElement('div');
  let newHTML = getTaskTemplate()(taskContent);
  newDivParent.innerHTML = newHTML;
  newDiv = newDivParent.firstChild;
  oldDiv.parentNode.replaceChild(newDiv, oldDiv);
  // Must attach listeners to the new elements
  attachTaskListeners(newDiv);
}

function attachTaskListeners(div) {
  div.querySelector('.complete')
    .addEventListener('click', completeTaskCallback);
  div.querySelector('.editForm')
    .addEventListener('submit', editTaskCallback);
  div.querySelector('.edit').addEventListener('click',
    function (event) {
      let form = event.currentTarget.parentNode
        .querySelector('.editForm');

      if (form.style.display === '')
        form.style.display = 'none';
      else
        form.style.display = '';
    }
  );
  div.querySelector('.cancel').addEventListener('click', function(event) {
    // Prevent button from reloading page
    event.preventDefault();
    event.currentTarget.parentNode.parentNode.style.display = 'none';
  });
}

function createTaskCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('task', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

function completeTaskCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = { id: div.dataset.id, rev: div.dataset.rev };
  if (isChecked(cbox)) body.dateCompleted = getDate();
  else body.dateCompleted = null;

  /* Disable the checkbox once the habit is being changed */
  cbox.disabled = true;

  httpPromise('complete-task', 'POST', 'application/json', body)
    .then(function (result) {
      /* (Un)completion successful! The current state of the checkbox
       * reflects the truth of what is in the database */
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      let taskContent = {
        id: result.task.id,
        rev: result.task.rev,
        task: new Task(result.task.name, result.task.amount,
          result.task.dateCompleted)
      };
      refreshTask(div, taskContent);
      cbox.disabled = false;
    }).catch(function (err) {
      /* Set the checkbox to be the opposite of what it has now, the habit's
       * completion was not toggled -- change the checkbox back */
      console.log('Error occurred when trying to complete the habit');
      console.log(err);
      reloadPage();
    });
}

function editTaskCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let div = form.parentNode;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value),
    rev: div.dataset.rev,
    id: div.dataset.id
  };
  httpPromise('edit-task', 'POST', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      result = JSON.parse(result);
      let taskContent = {
        id: result.task.id,
        rev: result.task.rev,
        task: new Task(result.task.name, result.task.amount,
          result.task.dateCharged)
      };
      refreshTask(div, taskContent);
      document.getElementById('balance').textContent = result.balance.balance;
    }).catch(function (err) {
      console.log(err);
      reloadPage();
    });
}
