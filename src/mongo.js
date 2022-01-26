
const { MongoClient } = require("mongodb");
const { mongoUri } = require("./config");


const DATABASE = 'sports'


async function loadFromDB(table, query) {
    const events = [];
    const callback = (doc) =>{
        //console.log(doc)
        events.push(doc)
    } 
    console.log(query)
    await findMany(
        DATABASE, table, query, callback
    )
    return events;
}


async function upsertBatch(items, idField, table) {
    const client = new MongoClient(mongoUri);
    const options = { upsert: true }
    try {
        await client.connect();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const query = {}
            query[idField] = item[idField]
            const update = {
                $set: item
            }
            await updateOneHelper(
                client, DATABASE, table, update, query, options
            )
        }
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}


async function findOne(table, query, options={}, default_value=null) {
    let document = default_value;
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const database = client.db(DATABASE);
        const collection = database.collection(table);
        document = await collection.findOne(query, options);
        if (document == null) {
            return default_value
        }
        //console.log(document);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
    return document;
}


async function findMany(db, table, query, callback, options={}) {
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const database = client.db(db);
        const collection = database.collection(table);
        const cursor = await collection.find(query, options);
        // print a message if no documents were found
        if ((await cursor.count()) === 0) {
            console.log("No documents found!");
        }
        // replace console.dir with your callback to access individual elements
        await cursor.forEach(callback);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}


async function updateOneHelper(client, db, table, updateDoc, filter, options={}) {
    const database = client.db(db);
    const collection = database.collection(table);
    const result = await collection.updateOne(filter, updateDoc, options);
    //console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);        
}


async function upsertOne(table, updateDoc, filter) {
    const client = new MongoClient(mongoUri);
    const options = { upsert: true }
    try {
        await client.connect();
        await updateOneHelper(client, DATABASE, table, updateDoc, filter, options)
    } finally {
        await client.close();
    }
}


module.exports = {
    loadFromDB: loadFromDB,
    upsertBatch: upsertBatch,
    findOne: findOne,
    upsertOne: upsertOne
}
