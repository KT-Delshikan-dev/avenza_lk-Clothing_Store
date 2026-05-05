const { Client, Users } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function run() {
    try {
        const res = await users.list();
        console.log('✅ Success with sgp- project ID!');
    } catch (e) {
        console.log(`❌ Fail with sgp- project ID: ${e.message} (${e.type})`);
    }
}

run();
