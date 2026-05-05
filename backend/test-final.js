const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const keys = [process.env.APPWRITE_API_KEY].filter(Boolean);

async function runTest() {
    for (const key of keys) {
        console.log(`Testing key: ${key.substring(0, 15)}...`);
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(key);
        
        const databases = new Databases(client);
        try {
            await databases.list();
            console.log('✅ Success!');
            return;
        } catch (error) {
            console.log(`❌ Error: ${error.message} (${error.type})`);
        }
    }
}

runTest();
