function refreshExpense(oldDiv, expense, rev) {
  let newDivParent = document.createElement('div');
  let newHTML = getExpenseTemplate()({
    id: oldDiv.dataset.id,
    rev: rev,
    name: expense.name,
    amount: expense.amount,
    dateCharged: expense.dateCharged
  });
  newDivParent.innerHTML = newHTML;
  newDiv = newDivParent.firstChild;
  oldDiv.parentNode.replaceChild(newDiv, oldDiv);

  /* Must re-attach event handlers to new elements
   * TODO: create a function for this and remove repeated code from index.js */
  newDiv.querySelector('.chargeExpense')
    .addEventListener('click', chargeExpenseCallback);
  newDiv.querySelector('.editExpenseForm')
    .addEventListener('submit', editExpenseCallback);
  newDiv.querySelector('.editExpense').addEventListener('click',
    function (event) {
      let form = event.currentTarget.parentNode.querySelector('.editExpenseForm');
      if (form.style.display === '')
        form.style.display = 'none';
      else
        form.style.display = '';
    }
  );
}

function createExpenseCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value)
  };
  httpPromise('expense', 'PUT', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      reloadPage();
    }).catch(function (err) {
      console.log(err);
    });
}

function chargeExpenseCallback(event) {
  let cbox = event.currentTarget;
  let div = cbox.parentNode;
  toggleCheckbox(cbox);

  let body = { id: div.dataset.id, rev: div.dataset.rev };
  if (isChecked(cbox)) body.dateCharged = getDate();
  else body.dateCharged = null;

  /* Disable the checkbox once the habit is being changed */
  cbox.disabled = true;

  httpPromise('charge-expense', 'POST', 'application/json', body)
    .then(function (result) {
      /* (Un)completion successful! The current state of the checkbox
       * reflects the truth of what is in the database */
      result = JSON.parse(result);
      document.getElementById('balance').textContent = result.balance;
      refreshExpense(div, expenseFromObject(result.expense), result.expense.rev);
      cbox.disabled = false;
    }).catch(function (err) {
      /* Set the checkbox to be the opposite of what it has now, the habit's
       * completion was not toggled -- change the checkbox back */
      console.log('Error occurred when trying to complete the habit');
      console.log(err);
      reloadPage();
    });
}

function editExpenseCallback(event) {
  event.preventDefault();
  let form = event.currentTarget;
  let div = form.parentNode;
  let body = {
    name: String(form.name.value),
    amount: Number(form.amount.value),
    rev: div.dataset.rev,
    id: div.dataset.id
  };
  httpPromise('edit-expense', 'POST', 'application/json', body)
    .then(function (result) {
      form.style.display = 'none';
      result = JSON.parse(result);
      refreshExpense(div, expenseFromObject(result.expense), result.expense.rev);
      document.getElementById('balance').textContent = result.balance.balance;
    }).catch(function (err) {
      console.log(err);
      reloadPage();
    });
}
