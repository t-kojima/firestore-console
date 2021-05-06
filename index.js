const admin = require('firebase-admin');
admin.initializeApp();

const replServer = require('repl').start('> ');
replServer.context.firestore = admin.firestore();
