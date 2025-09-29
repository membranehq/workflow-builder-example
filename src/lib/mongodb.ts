import { Db, MongoClient } from 'mongodb'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

// Extract database name from URI
const dbName = new URL(uri).pathname.substring(1)

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongooseConnection?: typeof mongoose
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise

  // Connect Mongoose
  if (!globalWithMongo._mongooseConnection) {
    mongoose.connect(uri).catch((err) => {
      console.error('Mongoose connection error:', err)
    })
    globalWithMongo._mongooseConnection = mongoose
  }
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()

  // Connect Mongoose
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(uri).catch((err) => {
      console.error('Mongoose connection error:', err)
    })
  }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Ensure Mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(uri)
  }

  const client = await clientPromise
  const db = client.db(dbName)
  return { client, db }
}
