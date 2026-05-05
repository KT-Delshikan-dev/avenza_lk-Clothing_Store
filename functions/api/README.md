# AVENZA Appwrite Function API

This function is the Appwrite-hosted backend path for the Cloudflare frontend.

## Appwrite Function Settings

- Runtime: Node.js 22
- Root directory: `functions/api`
- Entrypoint: `src/main.js`
- Build command: `npm install`
- Execute access: allow guests if the frontend calls it directly from the browser

## Environment Variables

Set these in Appwrite Console -> Functions -> API Function -> Settings -> Environment variables:

```env
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f1cb840006d2bde03e
APPWRITE_DATABASE_ID=69f1cbb00017b693e4c9
APPWRITE_COLLECTION_PRODUCTS=products
APPWRITE_COLLECTION_USERS=users
APPWRITE_COLLECTION_ORDERS=orders
JWT_SECRET=change_this_in_production
```

Also configure the function scopes so Appwrite's dynamic function key can access:

- `databases.read`
- `collections.read`
- `documents.read`
- `documents.write`
- `users.read`
- `users.write`
- `buckets.read`
- `files.read`
- `files.write`

After deployment, add a function domain in Appwrite and set Cloudflare Pages:

```env
REACT_APP_API_URL=https://your-appwrite-function-domain/api
REACT_APP_UPLOAD_URL=https://your-appwrite-function-domain
```

The current function covers auth and public product reads. Admin product uploads, payment slip uploads, email OTP, Stripe, and ML chatbot endpoints still need to be migrated before the whole Express backend can be removed.
