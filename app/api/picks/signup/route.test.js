/** @jest-environment node */
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let POST;
let connectToDatabase;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  
  // Require after env is set
  jest.resetModules();
  POST = require('./route').POST;
  connectToDatabase = require('@/app/utils/db').connectToDatabase;
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  const client = await connectToDatabase();
  const db = client.db('picks');
  await db.collection('users').deleteMany({});
  await client.close();
});

describe('Signup API Route', () => {
  it('creates a new user', async () => {
    const requestObj = {
      json: async () => ({ name: 'testuser', password: 'testpassword' })
    };

    const response = await POST(requestObj);
    expect(response.status).toBe(201);
    
    const responseData = await response.json();
    expect(responseData.message).toBe("User Added");

    // Verify in db
    const client = await connectToDatabase();
    const db = client.db('picks');
    const user = await db.collection('users').findOne({ name: 'testuser' });
    await client.close();

    expect(user).toBeDefined();
    expect(user.name).toBe('testuser');
    expect(user.password).toBeDefined();
    expect(user.password).not.toBe('testpassword'); // should be hashed
  });
});
