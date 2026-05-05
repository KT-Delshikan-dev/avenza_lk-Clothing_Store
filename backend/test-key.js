const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const endpoint = process.env.APPWRITE_ENDPOINT;

async function testKey() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
    
    const databases = new Databases(client);
    try {
        await databases.list();
        console.log('✅ Success with cleaned key!');
    } catch (error) {
        console.log(`❌ Failed with cleaned key: ${error.message}`);
    }
}

testKey();
