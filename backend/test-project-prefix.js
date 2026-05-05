const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const endpoint = process.env.APPWRITE_ENDPOINT;

async function testProjectIdPrefix() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
    
    const databases = new Databases(client);
    try {
        await databases.list();
        console.log('✅ Success with prefixed project ID!');
    } catch (error) {
        console.log(`❌ Failed with prefixed project ID: ${error.message}`);
    }
}

testProjectIdPrefix();
