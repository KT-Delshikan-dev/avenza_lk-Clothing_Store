import { Client, Account, Databases } from "appwrite";

const endpoint = process.env.REACT_APP_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.REACT_APP_APPWRITE_PROJECT_ID || "PROJECT_ID";

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
