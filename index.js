var admin = require("firebase-admin");
admin.initializeApp();

var replServer = require('repl').start('> ');
replServer.context.firestore = admin.firestore();
