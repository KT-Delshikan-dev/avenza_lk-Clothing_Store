# Appwrite Setup for AVENZA Clothing Store

This project already includes Appwrite integration in both backend and frontend.
Use the following setup to create the required Appwrite resources.

## 1. Appwrite Project

- Create a new Appwrite project or use an existing one.
- Note the project ID and endpoint.
- Create an API key with at least the following scopes for backend/function access:
  - `users.read`
  - `users.write`
  - `databases.read`
  - `databases.write`
  - `collections.read`
  - `collections.write`
  - `documents.read`
  - `documents.write`
  - `files.read`
  - `files.write`
  - `buckets.read`
  - `buckets.write`

## 2. Auth

### Enable authentication methods

- In Appwrite Console -> Auth -> Providers:
  - Enable Email / Password
  - Optionally configure OAuth providers (Google, if you want social login)

### Backend usage

The backend uses `backend/services/authService.js` to create users in Appwrite Auth and store user documents in the database.

## 3. Database

### Database

- Use database ID: `69f1cbb00017b693e4c9` (as used in project env files)

### Collections

Create the following collections with the field names shown:

#### `users`
- `name` (string)
- `email` (string)
- `phone` (string)
- `password` (string) - hashed password stored in DB
- `role` (string)
- `createdAt` (string)
- `emailVerification` (boolean) if stored or used

#### `products`
- `name` (string)
- `description` (string)
- `price` (float or string)
- `originalPrice` (float or string)
- `category` (string)
- `subCategory` (string)
- `images` (string) - JSON string of image objects
- `sizes` (string) - JSON string of size objects
- `colors` (string) - JSON string of color array
- `stock` (int)
- `sku` (string)
- `tags` (string) - JSON string of array
- `featured` (boolean)
- `isActive` (boolean)
- `excludeFromNewArrivals` (boolean)

#### `orders`
- `user` (string) - user ID
- `orderNumber` (string)
- `items` (string) - JSON string of order items
- `pricing` (string) - JSON string
- `deliveryAddress` (string) - JSON string
- `payment` (string) - JSON string
- `paymentMethod` (string)
- `statusHistory` (string) - JSON string
- `createdAt` (string)
- `status` (string)

#### `payment`
- Create as needed for future payment documents, though current code does not fully use it.

### Indexes / Permissions

- Ensure the collections allow read access for authenticated users where needed.
- For admin-only actions, use backend or function authorization.

## 4. Storage

### Storage bucket

Create a bucket for uploads. For example:

- Bucket ID: `product-images`
- Permissions: allow authenticated users to upload and read files if your app requires it.
- Or use a public bucket for storefront assets.

### Environment key

Add the bucket ID to `.env` or function settings as:
```
APPWRITE_STORAGE_BUCKET_ID=<bucket-id>
```

## 5. Function

The project already includes a function scaffold at `functions/api`.

### Function settings

- Runtime: Node.js 22
- Root directory: `functions/api`
- Entrypoint: `src/main.js`
- Build command: `npm install`
- Execute role: `any` or `guest` if frontend calls it directly

### Required environment variables

Set in Appwrite Function settings:
```env
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f1cb840006d2bde03e
APPWRITE_DATABASE_ID=69f1cbb00017b693e4c9
APPWRITE_COLLECTION_PRODUCTS=products
APPWRITE_COLLECTION_USERS=users
APPWRITE_COLLECTION_ORDERS=orders
APPWRITE_API_KEY=<your-appwrite-api-key>
JWT_SECRET=change_this_in_production
```

### Required function scopes

- `databases.read`
- `documents.read`
- `documents.write`
- `users.read`
- `users.write`

If you plan to use storage from the function, also add:
- `buckets.read`
- `files.read`
- `files.write`

## 6. Frontend configuration

Update `frontend/.env` with:
```
REACT_APP_API_URL=https://<your-function-domain>/api
REACT_APP_UPLOAD_URL=https://<your-function-domain>
REACT_APP_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
REACT_APP_APPWRITE_PROJECT_ID=69f1cb840006d2bde03e
REACT_APP_APPWRITE_DATABASE_ID=69f1cbb00017b693e4c9
REACT_APP_APPWRITE_COLLECTION_PRODUCTS=products
REACT_APP_APPWRITE_COLLECTION_USERS=users
REACT_APP_APPWRITE_COLLECTION_ORDERS=orders
REACT_APP_APPWRITE_COLLECTION_PAYMENT=payment
REACT_APP_APPWRITE_STORAGE_BUCKET_ID=<bucket-id>
```

## 7. Notes

- The repository already uses Appwrite in `backend/services/appwrite.js` and `frontend/src/services/appwrite.js`.
- The `functions/api` function currently supports auth and public product reads.
- Admin uploads, order payments, and ML chatbot endpoints are still in the Express backend and will require migration if you want to fully move to Appwrite functions.
