#!/usr/bin/env node

const { program } = require('commander');
program.option('-P, --projectId <value>', 'projectId').parse(process.argv);

const admin = require('firebase-admin');
if (program.opts().projectId) {
  const projectId = program.opts().projectId;
  admin.initializeApp({ projectId });
} else {
  admin.initializeApp();
}

const repl = require('repl');
const vm = require('vm');
const { processTopLevelAwait } = require('node-repl-await');

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}

async function myEval(code, context, filename, callback) {
  code = processTopLevelAwait(code) || code;

  try {
    let result = await vm.runInNewContext(code, context);
    callback(null, result);
  } catch (e) {
    if (isRecoverableError(e)) {
      callback(new repl.Recoverable(e));
    } else {
      console.log(e);
    }
  }
}

const replServer = repl.start({ prompt: '> ', eval: myEval });
replServer.context.firestore = admin.firestore();

function fetchCollection(path) {
  return replServer.context.firestore
    .collection(path)
    .get()
    .then(({ docs }) => docs.map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() })));
}
replServer.context.fetchCollection = fetchCollection;

function fetchDocument(path, id) {
  return replServer.context.firestore
    .collection(path)
    .doc(id)
    .get()
    .then((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
}
replServer.context.fetchDocument = fetchDocument;
