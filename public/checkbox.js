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
