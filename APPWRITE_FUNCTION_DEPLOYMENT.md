# Deploying Backend to Appwrite Functions

This guide explains how to deploy your Express backend to Appwrite Functions.

## **Architecture**
- **Database:** Appwrite Cloud (Databases, Auth, Storage)
- **Backend API:** Appwrite Functions
- **Frontend:** Cloudflare Pages (already deployed)

---

## **Step 1: Prepare the Appwrite Function**

The backend code in `functions/api/src/main.js` is an Appwrite Function that:
- Handles all API routes (auth, products, orders, users)
- Uses Appwrite Databases instead of MongoDB
- Uses Appwrite Storage for file uploads
- Runs on Appwrite serverless platform

### Key Differences from Express Backend

**Express:**
```javascript
app.post('/api/auth/login', (req, res) => {
  // Handle request
});
```

**Appwrite Function:**
```javascript
if (req.method === 'POST' && req.path === '/auth/login') {
  // Handle request
}
```

---

## **Step 2: Configure Environment Variables**

Make sure `functions/api/` has access to these environment variables in Appwrite Console:

### Required Variables:
```
APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=69f1cb840006d2bde03e
APPWRITE_API_KEY=standard_a25bdb33466650dd8c18daccf46ffd5b0063aae24289cb9557f0754b5edb9d47193025a682360dd9d4af764faaaec9ca9053caa38fe513cd4b64e75dc154850a10571dd3d53ded4d33a2b2f218b857d377c166978f90cda96761ae05317a9d1fbeae6de6f18ac62a7be0db97dfc3d46e8dc1a20cbf575c1596659f18b7db7a95
APPWRITE_DATABASE_ID=69f1cbb00017b693e4c9
APPWRITE_COLLECTION_PRODUCTS=products
APPWRITE_COLLECTION_USERS=users
APPWRITE_COLLECTION_ORDERS=orders
APPWRITE_COLLECTION_PAYMENT=payment
APPWRITE_STORAGE_BUCKET_ID=69f1d977003596de5eb0
JWT_SECRET=retrofits_lk_secret_key_2024_very_secure_password_change_in_production
```

---

## **Step 3: Deploy the Function to Appwrite**

### Option A: Using Appwrite CLI
```bash
# Install CLI
npm install -g appwrite-cli

# Login
appwrite login

# Create function
appwrite functions create \
  --functionId api \
  --name "Clothing Store API" \
  --runtime node-18.0 \
  --entrypoint src/main.js

# Deploy
appwrite deploy function
```

### Option B: Using Appwrite Console
1. Go to **Appwrite Console** → **Functions**
2. Click **Create Function**
3. Select **Node.js 18.0** runtime
4. Set **Entry Point:** `src/main.js`
5. Set **Function ID:** `api`
6. Upload `functions/api/` folder
7. Add environment variables
8. Click **Deploy**

---

## **Step 4: Get Your Function Domain**

Once deployed, you'll get a function URL like:
```
https://69f9b7cb00233177ea78.sgp.appwrite.run
```

This is your backend API base URL.

---

## **Step 5: Update Frontend Configuration**

Update `frontend/.env.example`:
```
REACT_APP_API_URL=https://69f9b7cb00233177ea78.sgp.appwrite.run/api
```

Then rebuild and deploy frontend:
```bash
cd frontend
npm install
npm run build

# Deploy to Cloudflare Pages (or your hosting)
```

---

## **Step 6: Test the Deployment**

```bash
# Test health check
curl https://69f9b7cb00233177ea78.sgp.appwrite.run/api/health

# Test login
curl -X POST https://69f9b7cb00233177ea78.sgp.appwrite.run/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Test get products
curl https://69f9b7cb00233177ea78.sgp.appwrite.run/api/products
```

---

## **Troubleshooting**

### 404 Errors on Routes
- Ensure `functions/api/src/main.js` has the route handler
- Check function environment variables are set correctly
- Verify function is deployed and active in Appwrite Console

### Authentication Errors
- Verify `JWT_SECRET` matches between backend and function
- Check `Authorization` header format: `Bearer <token>`

### File Upload Issues
- Appwrite Functions have limitations on file uploads (request body size limit)
- Consider using Appwrite Storage SDK for large files
- Or use a separate CDN/cloud storage like Cloudinary

---

## **Advantages of Appwrite Functions**
✅ Serverless - pay only for execution  
✅ Built-in Appwrite integration (no separate API key management)  
✅ Auto-scaling  
✅ Easy to manage from Appwrite Console  
✅ Same database/auth system  

## **Disadvantages**
❌ Limited file upload size (10MB request limit)  
❌ Cold start delays  
❌ Limited to Appwrite's Node.js versions  
❌ Cannot run scheduled tasks easily  

---

## **Rollback to Express Backend**

If Appwrite Functions don't work well, revert to Render:
```bash
# Deploy to Render using render.yaml we created earlier
git push origin main
# Then go to render.com and connect your repo
```

---

## **Next Steps**

1. Ensure all routes in `functions/api/src/main.js` are properly implemented
2. Test locally by running `npm start` in `functions/api/`
3. Deploy to Appwrite Console
4. Update frontend URL
5. Verify all endpoints respond correctly
