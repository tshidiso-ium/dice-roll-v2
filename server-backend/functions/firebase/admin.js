"use strict";

const {
    applicationDefault,
    getApp,
    getApps,
    initializeApp,
} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getDatabase} = require("firebase-admin/database");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");

const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
        databaseURL:
            process.env.DATABASE_URL ||
            "https://amadice-7e4fe-default-rtdb.firebaseio.com",
    });

const admin = {
    app: () => app,
    auth: () => getAuth(app),
    database: () => getDatabase(app),
    firestore: () => getFirestore(app),
    storage: () => getStorage(app),
};

module.exports = {admin};
