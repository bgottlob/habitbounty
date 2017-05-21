function refreshChore(oldDiv, choreContent) {
  let newDivParent = document.createElement('div');
  let newHTML = getChoreTemplate()(choreContent);
  newDivParent.innerHTML = newHTML;
  newDiv = newDivParent.firstChild;
  oldDiv.parentNode.replaceChild(newDiv, oldDiv);
  attachChoreListeners(newDiv);
}

function attachChoreListeners(div) {
  div.querySelector('.edit').addEventListener('click', function(event) {
    let form = event.currentTarget.parentNode.querySelector('.editForm');
    if (form.style.display === '')
      form.style.display = 'none';
    else
      form.style.display = '';
  });
  div.querySelector('.editForm')
    .addEventListener('submit', editChoreCallback);
  div.querySelector('.complete')
    .addEventListener('click', completeChoreCallback);
  div.querySelector('.cancel').addEventListener('click', function(event) {
    event.preventDefault(); /* Prevent button from reloading page */
    event.currentTarget.parentNode.parentNode.style.display = 'none';
  });
}

function createChoreCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('chore', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

function editChoreCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let div = form.parentNode;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value),
    rev: String(div.dataset.rev),
    id: div.dataset.id
  };
  httpPromise('edit-chore', 'POST', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      result = JSON.parse(result);
      let choreContent = {
        id: result.id,
        rev: result.rev,
        chore: new Chore(result.name, result.amount, result.log)
      };
      refreshChore(div, choreContent);
    }).catch(function (err) {
      console.log(err);
      reloadPage();
    });
}

function completeChoreCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = {
    id: div.dataset.id,
    rev: div.dataset.rev,
    set: isChecked(cbox),
    date: getDate()
  };

  cbox.disabled = true;

  httpPromise('complete-chore', 'POST', 'application/json', body)
    .then((result) => {
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      let choreContent = {
        id: result.chore.id,
        rev: result.chore.rev,
        chore: new Chore(result.chore.name, result.chore.amount, result.chore.log)
      };
      refreshChore(div, choreContent);
      cbox.disabled = false;
    }).catch((err) => {
      console.log('Error occurred when trying to complete the chore');
      console.log(err);
      reloadPage();
    });
}
