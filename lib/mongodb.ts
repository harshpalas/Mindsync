import { MongoClient } from "mongodb"

export const MONGODB_URI_MISSING_ERROR =
  'Invalid/Missing environment variable: "MONGODB_URI". Add it in .env.local (see .env.example).'

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>

if (!uri) {
  clientPromise = Promise.reject(new Error(MONGODB_URI_MISSING_ERROR))
} else if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }

  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise
