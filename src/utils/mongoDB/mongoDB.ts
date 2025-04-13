import { MongoClient, Db } from 'mongodb'
import { TimeConstraints } from '../types'
import dotenv from 'dotenv'
dotenv.config()

const uri = process.env.MONGODB_CONNECTION_STRING
const dbName = process.env.MONGODB_DB_NAME

let client: MongoClient
let db: Db

export async function connectToDatabase(): Promise<Db> {
    try {
        if (!client) {
            client = new MongoClient(uri);
            await client.connect();
            db = client.db(dbName);
        }      
    } catch (err) {
        throw (err)
    }
  return db;
}

export async function getTimeConstraints(): Promise<TimeConstraints> {
    if (!db) {
        throw new Error('You are NOT Connected to MongoDB!')
    }
    const collection = db.collection<TimeConstraints>(process.env.MONGODB_COLLECTION_NAME);

    const timeConstraints = await collection.findOne({});
    if (!timeConstraints) {
        throw new Error('time constraints was falsy')
    }
    
    return timeConstraints
}

export async function saveEventLogToDB(eventLog: string): Promise<void> {
    if (!db) {
        throw new Error('You are NOT Connected to MongoDB!')
    }
    const collection = db.collection<Record<string, string>>('event-log');
    try {

        await collection.insertOne({ eventLog: eventLog })
    } catch (err) {
        throw err
    }
}