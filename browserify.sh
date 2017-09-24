browserify modules/lib/habit.js --standalone Habit -o public/habit.js
browserify modules/lib/balance.js --standalone Balance -o public/balance.js
browserify modules/lib/expense.js --standalone Expense -o public/expense.js
browserify modules/lib/chore.js --standalone Chore -o public/chore.js
browserify modules/lib/task.js --standalone Task -o public/task.js
# There are no module exports that need to be picked up here
browserify modules/lib/sharedLib.js -o public/sharedLib.js
