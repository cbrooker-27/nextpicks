import { MongoClient, ServerApiVersion } from "mongodb";

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://${process.env.MONGODB_SERVER}?retryWrites=true&w=majority`;

// if (!process.env.MONGODB_URI) {
//   throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
// }

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client;

// if (process.env.NODE_ENV === "development") {
//   // In development mode, use a global variable so that the value
//   // is preserved across module reloads caused by HMR (Hot Module Replacement).
//   let globalWithMongo = global as typeof globalThis & {
//     _mongoClient?: MongoClient
//   }

//   if (!globalWithMongo._mongoClient) {
//     globalWithMongo._mongoClient = new MongoClient(uri, options)
//   }
//   client = globalWithMongo._mongoClient
// } else {
// In production mode, it's best to not use a global variable.
client = new MongoClient(uri, options);
//}

// Export a module-scoped MongoClient. By doing this in a
// separate module, the client can be shared across functions.
export default client;
