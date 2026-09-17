
const helperFunctions = require('../helperFunctions/index.js');

const getCollectionAdmin = async (db, collectionName) => {
    const collectionRef = db.collection(collectionName);
    var Collections = [];
    try{
        const snapshot = await collectionRef.get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        snapshot.forEach(doc => {
            Collections.push(
                { 
                    "id" : doc.id, 
                    "data" : doc.data()
                }
            );
        });
        return Collections;
    }
    catch(err){
        console.log("firstoreFunctions GetCollection: Error");
        console.log(err);
        throw new Error(err);
    }
}

const getCollectionManager = async (db, collectionName, managerName) => {
    const collectionRef = db.collection(collectionName);
    var Collections = [];
    try{
        const snapshot = await collectionRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
            return {message: 'No matching documents'};
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.reportsTo === managerName) {  // Filter based on the "reportsTo" field
                Collections.push({ 
                    id: doc.id, 
                    data: data
                });
            }
        });
        return Collections;
    }
    catch(err){
                console.log("firstoreFunctions GetCollection: Error");
        console.log(err);
        throw new Error(err);
    }
}

const getDoc = async (db, collectionName, uid) => {
    try{
        const collectionRef = await db.collection(collectionName).doc(uid);
        const doc = await collectionRef.get()
        if(!doc.exists){
            console.log("Mo such document");
            return null;
        }
        else{
            return doc.data();
        }
    }
    catch(err){
        console.log(err);
        console.log("geDoc : Error");
        throw new Error(err);
    }
}

const createDoc = async (db, collectionName, uid, data) => {
    try{
        const res = await db.collection(collectionName).doc(uid).set(data);
        return res;
    }
    catch(err){
        console.log("createDoc : Error");
        console.log(err);
        throw new Error(err);
    }
}
const createDoc2 = async (db, boardId, data) => {
  try {
    const currentDate = helperFunctions.getSouthAfricanTime();
    const archiveDate = currentDate.toISOString().slice(0, 10);
    await db
      .collection("boards")
      .doc(`${data.betAmount}`)
      .collection("games")
      .doc(boardId)
      .set({...data, archiveDate});
    return { message: "Board created successfully", boardId };
  } catch (err) {
    console.error("Board archive write failed", {boardId, message: err?.message || "Unknown error"});
    throw err;
  }
};

const updateDoc = async (db, collectionName, uid, data) => {
    try{
        const docRef = await db.collection(collectionName).doc(uid);
        const res = await docRef.update(data);
        return res;
    }
    catch(err){
        console.log("createDoc : Error");
        console.log(err);
        throw new Error(err);
    }
}

module.exports = {
    getCollectionAdmin,
    getCollectionManager,
    getDoc,
    createDoc,
    createDoc2,
    updateDoc
} 
