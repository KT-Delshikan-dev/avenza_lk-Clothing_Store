# Appwrite Function Deployment Guide

Your Express backend has been migrated to Appwrite Functions! This function handles all your API routes: Auth, Products, and Orders.

## **What's Included**

✅ Authentication (Register, Login, Me, Profile Update)  
✅ Products (Get, Create, Update, Delete, Subcategories)  
✅ Orders (Create, Get, List, Cancel, Update Status)  
✅ Admin Routes (Require admin role)  
✅ Error Handling  
✅ JWT Authentication  

---

## **Deployment Steps**

### **Step 1: Prepare for Deployment**

Ensure you have:
- Appwrite CLI installed: `npm install -g appwrite-cli`
- Appwrite Console access
- Your Appwrite credentials

### **Step 2: Deploy Using Appwrite Console**

1. **Go to Appwrite Console** → `Functions`
2. **Click "Create Function"**
3. **Configure:**
   - **Name:** `Clothing Store API`
   - **Runtime:** `Node.js 18.0`
   - **Entry Point:** `src/main.js`
   - **Events:** (Leave empty - HTTP trigger)

4. **Upload `functions/api/` folder** or clone from GitHub

5. **Set Environment Variables** in the function settings:
   ```
   APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=69f1cb840006d2bde03e
   APPWRITE_API_KEY=<your-api-key>
   APPWRITE_DATABASE_ID=69f1cbb00017b693e4c9
   APPWRITE_COLLECTION_PRODUCTS=products
   APPWRITE_COLLECTION_USERS=users
   APPWRITE_COLLECTION_ORDERS=orders
   APPWRITE_COLLECTION_PAYMENT=payment
   APPWRITE_STORAGE_BUCKET_ID=69f1d977003596de5eb0
   JWT_SECRET=retrofits_lk_secret_key_2024_very_secure_password_change_in_production
   FRONTEND_URL=https://clothing-store-e3s.pages.dev
   ```

6. **Click "Deploy"** and wait for it to finish (5-10 minutes)

7. **Get Your Function Domain:**
   - Go to Function Settings
   - Copy the **Domain URL** (e.g., `https://69f9b7cb00233177ea78.sgp.appwrite.run`)

---

### **Step 3: Update Frontend**

Once deployed, update your frontend environment:

**File:** `frontend/.env` or `frontend/.env.example`

```env
REACT_APP_API_URL=https://<your-function-domain>/api
```

Example:
```env
REACT_APP_API_URL=https://69f9b7cb00233177ea78.sgp.appwrite.run/api
```

Then rebuild and redeploy frontend.

---

## **Testing the Deployment**

### **Test Health Check**
```bash
curl https://69f9b7cb00233177ea78.sgp.appwrite.run/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Appwrite API is running",
  "timestamp": "2026-05-05T..."
}
```

### **Test Login**
```bash
curl -X POST https://69f9b7cb00233177ea78.sgp.appwrite.run/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

### **Test Get Products**
```bash
curl https://69f9b7cb00233177ea78.sgp.appwrite.run/api/products
```

### **Test Protected Route (Get Current User)**
```bash
curl https://69f9b7cb00233177ea78.sgp.appwrite.run/api/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## **API Endpoints Available**

### **Auth Routes**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `GET /api/auth/me-social` - Get user by email
- `PUT /api/auth/profile` - Update profile (requires auth)

### **Product Routes**
- `GET /api/products` - Get all products (supports filters, pagination)
- `GET /api/products/:id` - Get single product
- `GET /api/products/subcategories` - Get all subcategories
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### **Order Routes**
- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders` - Get my orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth, owner or admin)
- `GET /api/orders/admin/all` - Get all orders (admin only)
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `DELETE /api/orders/:id/cancel` - Cancel order (requires auth, owner or admin)

---

## **Troubleshooting**

### **404 Routes**
- Verify the function is deployed and active
- Check environment variables are set correctly
- Ensure function domain is correct

### **401 Unauthorized**
- Check JWT token format: `Authorization: Bearer <token>`
- Verify `JWT_SECRET` matches between function and frontend
- Token may have expired

### **403 Forbidden**
- Check user role (admin endpoints require role='admin')
- Verify user ownership of resource (orders)

### **500 Internal Server Error**
- Check function logs in Appwrite Console
- Verify database collections and IDs are correct
- Ensure API key has proper permissions

---

## **File Upload Limitations**

⚠️ **Appwrite Functions have 10MB request body limit**

For larger file uploads:
1. Use Appwrite Storage SDK directly from frontend
2. Or upload files separately to Appwrite Storage bucket
3. Store file IDs in Appwrite documents

Current implementation stores product images as URLs only (no file upload in function).

---

## **Next Steps**

1. ✅ Deploy function to Appwrite Console
2. ✅ Get function domain
3. ✅ Update frontend `.env` with function URL
4. ✅ Test all endpoints
5. ✅ Deploy frontend with new backend URL
6. ✅ Monitor function logs for errors

---

## **Differences from Express Backend**

| Feature | Express | Appwrite Function |
|---------|---------|------------------|
| **Routing** | `app.get('/path', handler)` | Manual path matching |
| **Middleware** | Middleware stack | Manual checks per route |
| **Startup** | Always running | On-demand execution |
| **Cold Starts** | None | 1-2 seconds initially |
| **File Upload** | Multer (unlimited) | 10MB request limit |
| **Pricing** | Server cost per month | Pay per execution |
| **Scalability** | Manual | Auto-scaling |

---

## **Support**

For issues:
1. Check Appwrite Function Logs in Console
2. Verify environment variables
3. Test routes with curl/Postman
4. Check frontend network requests
5. Review error messages in response

You're all set! Your backend is now running serverless on Appwrite! 🚀
