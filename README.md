# HabitBounty
A CouchDB-powered Node.js web app that helps you build habits by rewarding you with spending money

## Getting Started
1. [Install CouchDB](http://docs.couchdb.org/en/2.0.0/install/index.html) then start it (on the machine you want to run CouchDB on)
1. Run `npm install` in the root HabitBounty directory to install the node dependencies
1. Set the following environment variables (or just use the defaults):
    - `COUCH_HOST`: the url to your CouchDB host with the port number (default: `http://localhost:5984`)
    - `COUCH_USER`: the username of your CouchDB user
    - `COUCH_PASS`: the password for your CouchDB user
    - `HB_DB_NAME`: the name of the database to use for HabitBounty in CouchDB (default: `habitbounty`)
1. Run `node start_script.js`. This creates a database on your CouchDB host and adds a default data document and the necessary design doc for running HabitBounty
1. Run `node index.js <port-num>` to start the app, where `<port-num>` is the port you want to run the server on
1. Visit `http://localhost:<port-num>` to use the app
