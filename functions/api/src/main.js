import {
  Client,
  Databases,
  Users,
  ID,
  Query,
  Storage
} from 'node-appwrite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  jwtSecret: process.env.JWT_SECRET || 'change_this_in_production',
  collections: {
    products: process.env.APPWRITE_COLLECTION_PRODUCTS || 'products',
    users: process.env.APPWRITE_COLLECTION_USERS || 'users',
    orders: process.env.APPWRITE_COLLECTION_ORDERS || 'orders',
    payment: process.env.APPWRITE_COLLECTION_PAYMENT || 'payment'
  },
  storageBucket: process.env.APPWRITE_STORAGE_BUCKET_ID,
  frontendUrl: process.env.FRONTEND_URL || '*'
};

const jsonHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': config.frontendUrl,
  'Content-Type': 'application/json'
};

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

function createServices(req) {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY not configured');
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(apiKey);

  return {
    databases: new Databases(client),
    users: new Users(client),
    storage: new Storage(client)
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function response(res, status, body) {
  return res.json(body, status, jsonHeaders);
}

function getPath(req) {
  const rawPath = req.path || req.url || '/';
  return rawPath.replace(/^\/api/, '') || '/';
}

function getAuthUser(req) {
  try {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
}

function normalizeDocument(doc) {
  return { ...doc, id: doc.$id };
}

function parseJsonField(value, fallback = null) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProduct(doc) {
  const product = normalizeDocument(doc);
  product.images = parseJsonField(doc.images, []);
  product.sizes = parseJsonField(doc.sizes, []);
  product.colors = parseJsonField(doc.colors, []);
  product.tags = parseJsonField(doc.tags, []);
  delete product.$collectionId;
  delete product.$databaseId;
  delete product.$permissions;
  return product;
}

function normalizeOrder(doc) {
  const order = normalizeDocument(doc);
  order.items = parseJsonField(doc.items, []);
  order.pricing = parseJsonField(doc.pricing, {});
  order.deliveryAddress = parseJsonField(doc.deliveryAddress, {});
  order.payment = parseJsonField(doc.payment, {});
  order.statusHistory = parseJsonField(doc.statusHistory, []);
  delete order.$collectionId;
  delete order.$databaseId;
  delete order.$permissions;
  return order;
}

async function getUserByEmail(databases, email) {
  const result = await databases.listDocuments(
    config.databaseId,
    config.collections.users,
    [Query.equal('email', email)]
  );
  if (result.total === 0) return null;
  return normalizeDocument(result.documents[0]);
}


// ============================================================================
// AUTH HANDLERS
// ============================================================================

async function handleRegister(req, res, services) {
  try {
    const { email, password, name, phone } = req.bodyJson || {};
    
    if (!email || !password || !name) {
      return response(res, 400, { 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    const existing = await getUserByEmail(services.databases, email);
    if (existing) {
      return response(res, 409, { 
        success: false, 
        message: 'User already exists' 
      });
    }

    const formattedPhone = phone && phone.trim().startsWith('+') ? phone.trim() : undefined;
    
    try {
      const authUser = await services.users.create(
        ID.unique(),
        email,
        formattedPhone,
        password,
        name
      );

      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
      
      await services.databases.createDocument(
        config.databaseId,
        config.collections.users,
        authUser.$id,
        {
          name,
          email,
          phone: phone || '',
          password: hashedPassword,
          role: 'user',
          createdAt: new Date().toISOString()
        }
      );

      const token = jwt.sign(
        { id: authUser.$id, email: authUser.email, role: 'user' },
        config.jwtSecret,
        { expiresIn: '30d' }
      );

      return response(res, 201, {
        success: true,
        message: 'User registered successfully.',
        token,
        user: {
          id: authUser.$id,
          name: authUser.name,
          email: authUser.email,
          role: 'user'
        }
      });
    } catch (authError) {
      console.error('Appwrite Auth error:', authError);
      return response(res, 400, { 
        success: false, 
        message: 'Registration failed',
        error: authError.message 
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
}

async function handleLogin(req, res, services) {
  try {
    const { email, password } = req.bodyJson || {};
    
    if (!email || !password) {
      return response(res, 400, { 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await getUserByEmail(services.databases, email);
    
    if (!user || !user.password) {
      return response(res, 401, { 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    
    if (!passwordMatches) {
      return response(res, 401, { 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    return response(res, 200, {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerification: user.emailVerification
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
}

async function handleGetMe(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const userDoc = await services.databases.getDocument(
      config.databaseId,
      config.collections.users,
      user.id
    );

    return response(res, 200, {
      success: true,
      user: {
        id: normalizeDocument(userDoc).id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return response(res, 401, { 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
}

async function handleMeSocial(req, res, services) {
  try {
    const email = req.headers['x-user-email'] || req.query?.email;
    
    if (!email) {
      return response(res, 400, { 
        success: false, 
        message: 'Email is required' 
      });
    }

    let user = await getUserByEmail(services.databases, email);
    
    if (user) {
      return response(res, 200, {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      return response(res, 404, { 
        success: false, 
        message: 'User not found' 
      });
    }
  } catch (error) {
    console.error('MeSocial error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Error fetching user',
      error: error.message 
    });
  }
}

async function handleUpdateProfile(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const updateData = req.bodyJson || {};
    const { email, password, role, ...allowedUpdates } = updateData;

    const updated = await services.databases.updateDocument(
      config.databaseId,
      config.collections.users,
      user.id,
      allowedUpdates
    );

    return response(res, 200, {
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: normalizeDocument(updated).id,
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
}

// ============================================================================
// PRODUCT HANDLERS
// ============================================================================

async function handleGetProducts(req, res, services) {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query || {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const queries = [];
    if (category) queries.push(Query.equal('category', category));
    if (minPrice) queries.push(Query.greaterThanEqual('price', parseFloat(minPrice)));
    if (maxPrice) queries.push(Query.lessThanEqual('price', parseFloat(maxPrice)));
    if (search) queries.push(Query.search('name', search));
    
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('$createdAt'));

    const result = await services.databases.listDocuments(
      config.databaseId,
      config.collections.products,
      queries
    );

    return response(res, 200, {
      success: true,
      data: result.documents.map(normalizeProduct),
      total: result.total,
      page: parseInt(page),
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('GetProducts error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch products',
      error: error.message 
    });
  }
}

async function handleGetProductById(req, res, services) {
  try {
    const productId = req.params?.id || req.url?.split('/')[3];
    
    if (!productId) {
      return response(res, 400, { 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    const doc = await services.databases.getDocument(
      config.databaseId,
      config.collections.products,
      productId
    );

    return response(res, 200, {
      success: true,
      data: normalizeProduct(doc)
    });
  } catch (error) {
    if (error.code === 404) {
      return response(res, 404, { 
        success: false, 
        message: 'Product not found' 
      });
    }
    console.error('GetProductById error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch product',
      error: error.message 
    });
  }
}

async function handleCreateProduct(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const productData = req.bodyJson || {};

    // Parse JSON fields
    if (typeof productData.sizes === 'string') {
      try { productData.sizes = JSON.parse(productData.sizes); } catch (e) {}
    }
    if (typeof productData.colors === 'string') {
      try { productData.colors = JSON.parse(productData.colors); } catch (e) {}
    }
    if (typeof productData.tags === 'string') {
      try { productData.tags = JSON.parse(productData.tags); } catch (e) {}
    }
    if (typeof productData.images === 'string') {
      try { productData.images = JSON.parse(productData.images); } catch (e) {}
    }

    // Convert arrays to JSON strings for storage
    const dataToStore = {
      ...productData,
      sizes: Array.isArray(productData.sizes) ? JSON.stringify(productData.sizes) : productData.sizes,
      colors: Array.isArray(productData.colors) ? JSON.stringify(productData.colors) : productData.colors,
      images: Array.isArray(productData.images) ? JSON.stringify(productData.images) : productData.images,
      tags: Array.isArray(productData.tags) ? JSON.stringify(productData.tags) : productData.tags,
      price: productData.price ? parseFloat(productData.price) : 0,
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : undefined,
      featured: productData.featured === 'true' || productData.featured === true,
      isActive: productData.isActive === 'true' || productData.isActive === true
    };

    const doc = await services.databases.createDocument(
      config.databaseId,
      config.collections.products,
      ID.unique(),
      dataToStore
    );

    return response(res, 201, {
      success: true,
      message: 'Product created successfully',
      data: normalizeProduct(doc)
    });
  } catch (error) {
    console.error('CreateProduct error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to create product',
      error: error.message 
    });
  }
}

async function handleUpdateProduct(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const productId = req.params?.id || req.url?.split('/')[3];
    const updateData = req.bodyJson || {};

    if (!productId) {
      return response(res, 400, { 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Get existing product to merge with updates
    const existing = await services.databases.getDocument(
      config.databaseId,
      config.collections.products,
      productId
    );

    // Parse and merge arrays
    const sizes = updateData.sizes || parseJsonField(existing.sizes, []);
    const colors = updateData.colors || parseJsonField(existing.colors, []);
    const images = updateData.images || parseJsonField(existing.images, []);
    const tags = updateData.tags || parseJsonField(existing.tags, []);

    const dataToStore = {
      ...existing,
      ...updateData,
      sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : sizes,
      colors: Array.isArray(colors) ? JSON.stringify(colors) : colors,
      images: Array.isArray(images) ? JSON.stringify(images) : images,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
      price: updateData.price ? parseFloat(updateData.price) : existing.price,
      originalPrice: updateData.originalPrice ? parseFloat(updateData.originalPrice) : existing.originalPrice
    };

    const doc = await services.databases.updateDocument(
      config.databaseId,
      config.collections.products,
      productId,
      dataToStore
    );

    return response(res, 200, {
      success: true,
      message: 'Product updated successfully',
      data: normalizeProduct(doc)
    });
  } catch (error) {
    console.error('UpdateProduct error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to update product',
      error: error.message 
    });
  }
}

async function handleDeleteProduct(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const productId = req.params?.id || req.url?.split('/')[3];

    if (!productId) {
      return response(res, 400, { 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    await services.databases.deleteDocument(
      config.databaseId,
      config.collections.products,
      productId
    );

    return response(res, 200, {
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('DeleteProduct error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to delete product',
      error: error.message 
    });
  }
}

async function handleGetSubcategories(req, res, services) {
  try {
    const result = await services.databases.listDocuments(
      config.databaseId,
      config.collections.products,
      [Query.limit(5000)]
    );

    const categories = {};
    result.documents.forEach(doc => {
      if (doc.category && doc.subCategory) {
        if (!categories[doc.category]) {
          categories[doc.category] = new Set();
        }
        categories[doc.category].add(doc.subCategory);
      }
    });

    const data = {};
    Object.keys(categories).forEach(cat => {
      data[cat] = Array.from(categories[cat]);
    });

    return response(res, 200, {
      success: true,
      data
    });
  } catch (error) {
    console.error('GetSubcategories error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch subcategories',
      error: error.message 
    });
  }
}

// ============================================================================
// ORDER HANDLERS
// ============================================================================

async function handleCreateOrder(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const orderData = req.bodyJson || {};
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const enrichedItems = await Promise.all(items.map(async (item) => {
      try {
        const product = await services.databases.getDocument(
          config.databaseId,
          config.collections.products,
          item.product
        );
        const images = parseJsonField(product.images, []);
        const imageUrl = Array.isArray(images) && images.length > 0 ? images[0]?.url : null;
        
        return {
          ...item,
          name: product.name,
          price: product.price,
          image: imageUrl
        };
      } catch (error) {
        console.error(`Error enriching item ${item.product}:`, error.message);
        return item;
      }
    }));

    const preparedData = {
      user: user.id,
      orderNumber,
      items: JSON.stringify(enrichedItems),
      pricing: JSON.stringify(orderData.pricing || { subtotal: 0, shipping: 0, total: 0 }),
      deliveryAddress: JSON.stringify(orderData.deliveryAddress || {}),
      payment: JSON.stringify(orderData.payment || {}),
      paymentMethod: orderData.paymentMethod || orderData.payment?.method || 'unknown',
      statusHistory: JSON.stringify([{ 
        status: 'pending', 
        note: 'Order placed', 
        timestamp: new Date().toISOString() 
      }]),
      createdAt: new Date().toISOString(),
      status: orderData.status || 'pending'
    };

    const doc = await services.databases.createDocument(
      config.databaseId,
      config.collections.orders,
      ID.unique(),
      preparedData
    );

    return response(res, 201, {
      success: true,
      message: 'Order created successfully',
      data: normalizeOrder(doc)
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to create order',
      error: error.message 
    });
  }
}

async function handleGetMyOrders(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const result = await services.databases.listDocuments(
      config.databaseId,
      config.collections.orders,
      [
        Query.equal('user', user.id),
        Query.orderDesc('$createdAt')
      ]
    );

    return response(res, 200, {
      success: true,
      data: result.documents.map(normalizeOrder)
    });
  } catch (error) {
    console.error('GetMyOrders error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
}

async function handleGetOrder(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const orderId = req.params?.id || req.url?.split('/')[3];

    if (!orderId) {
      return response(res, 400, { 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    const doc = await services.databases.getDocument(
      config.databaseId,
      config.collections.orders,
      orderId
    );

    const order = normalizeOrder(doc);
    const orderUserId = order.user?.id || order.user;

    if (orderUserId !== user.id && user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    return response(res, 200, {
      success: true,
      data: order
    });
  } catch (error) {
    if (error.code === 404) {
      return response(res, 404, { 
        success: false, 
        message: 'Order not found' 
      });
    }
    console.error('GetOrder error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch order',
      error: error.message 
    });
  }
}

async function handleGetAllOrders(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { status, page = 1, limit = 20 } = req.query || {};
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const queries = [];
    if (status) queries.push(Query.equal('status', status));
    queries.push(Query.limit(parseInt(limit)));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('$createdAt'));

    const result = await services.databases.listDocuments(
      config.databaseId,
      config.collections.orders,
      queries
    );

    return response(res, 200, {
      success: true,
      data: result.documents.map(normalizeOrder),
      total: result.total,
      page: parseInt(page),
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error('GetAllOrders error:', error);
    return response(res, 500, { 
      success: false, 
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
}

async function handleUpdateOrderStatus(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const orderId = req.params?.id || req.url?.split('/')[3];
    const { status } = req.bodyJson || {};

    if (!orderId || !status) {
      return response(res, 400, { 
        success: false, 
        message: 'Order ID and status are required' 
      });
    }

    const doc = await services.databases.getDocument(
      config.databaseId,
      config.collections.orders,
      orderId
    );

    const order = normalizeOrder(doc);
    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status,
      note: `Status updated to ${status}`,
      timestamp: new Date().toISOString()
    });

    const updated = await services.databases.updateDocument(
      config.databaseId,
      config.collections.orders,
      orderId,
      {
        status,
        statusHistory: JSON.stringify(statusHistory)
      }
    );

    return response(res, 200, {
      success: true,
      message: 'Order status updated',
      data: normalizeOrder(updated)
    });
  } catch (error) {
    console.error('UpdateOrderStatus error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to update order status',
      error: error.message 
    });
  }
}

async function handleCancelOrder(req, res, services) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return response(res, 401, { 
        success: false, 
        message: 'Not authorized' 
      });
    }

    const orderId = req.params?.id || req.url?.split('/')[3];

    if (!orderId) {
      return response(res, 400, { 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    const doc = await services.databases.getDocument(
      config.databaseId,
      config.collections.orders,
      orderId
    );

    const order = normalizeOrder(doc);
    const orderUserId = order.user?.id || order.user;

    if (orderUserId !== user.id && user.role !== 'admin') {
      return response(res, 403, { 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    if (['cancelled', 'completed', 'shipped'].includes(order.status)) {
      return response(res, 400, { 
        success: false, 
        message: `Cannot cancel order with status ${order.status}` 
      });
    }

    const updated = await services.databases.updateDocument(
      config.databaseId,
      config.collections.orders,
      orderId,
      { status: 'cancelled' }
    );

    return response(res, 200, {
      success: true,
      message: 'Order cancelled successfully',
      data: normalizeOrder(updated)
    });
  } catch (error) {
    console.error('CancelOrder error:', error);
    return response(res, 400, { 
      success: false, 
      message: 'Failed to cancel order',
      error: error.message 
    });
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

async function handleHealth(req, res) {
  return response(res, 200, {
    status: 'OK',
    message: 'Appwrite API is running',
    timestamp: new Date().toISOString()
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function (req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return response(res, 200, {});
  }

  const path = getPath(req);
  const method = req.method;

  try {
    const services = createServices(req);

    // ====== AUTH ROUTES ======
    if (method === 'POST' && path === '/auth/register') {
      return await handleRegister(req, res, services);
    }
    if (method === 'POST' && path === '/auth/login') {
      return await handleLogin(req, res, services);
    }
    if (method === 'GET' && path === '/auth/me') {
      return await handleGetMe(req, res, services);
    }
    if (method === 'GET' && path === '/auth/me-social') {
      return await handleMeSocial(req, res, services);
    }
    if (method === 'PUT' && path === '/auth/profile') {
      return await handleUpdateProfile(req, res, services);
    }

    // ====== PRODUCT ROUTES ======
    if (method === 'GET' && path === '/products') {
      return await handleGetProducts(req, res, services);
    }
    if (method === 'GET' && path === '/products/subcategories') {
      return await handleGetSubcategories(req, res, services);
    }
    if (method === 'POST' && path === '/products') {
      return await handleCreateProduct(req, res, services);
    }
    if (method === 'GET' && path.match(/^\/products\/[^/]+$/)) {
      return await handleGetProductById(req, res, services);
    }
    if (method === 'PUT' && path.match(/^\/products\/[^/]+$/)) {
      return await handleUpdateProduct(req, res, services);
    }
    if (method === 'DELETE' && path.match(/^\/products\/[^/]+$/)) {
      return await handleDeleteProduct(req, res, services);
    }

    // ====== ORDER ROUTES ======
    if (method === 'POST' && path === '/orders') {
      return await handleCreateOrder(req, res, services);
    }
    if (method === 'GET' && path === '/orders') {
      return await handleGetMyOrders(req, res, services);
    }
    if (method === 'GET' && path === '/orders/admin/all') {
      return await handleGetAllOrders(req, res, services);
    }
    if (method === 'GET' && path.match(/^\/orders\/[^/]+$/) && !path.includes('admin')) {
      return await handleGetOrder(req, res, services);
    }
    if (method === 'PUT' && path.match(/^\/orders\/[^/]+\/status$/)) {
      return await handleUpdateOrderStatus(req, res, services);
    }
    if (method === 'DELETE' && path.match(/^\/orders\/[^/]+\/cancel$/)) {
      return await handleCancelOrder(req, res, services);
    }

    // ====== HEALTH CHECK ======
    if (method === 'GET' && path === '/health') {
      return await handleHealth(req, res);
    }

    // 404 - Route not found
    return response(res, 404, {
      success: false,
      message: 'Route not found',
      path,
      method
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return response(res, 500, {
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

