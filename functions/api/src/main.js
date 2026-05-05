import {
  Client,
  Databases,
  Users,
  ID,
  Query
} from 'node-appwrite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const jsonHeaders = {
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID,
  databaseId: process.env.APPWRITE_DATABASE_ID,
  productsCollection: process.env.APPWRITE_COLLECTION_PRODUCTS || 'products',
  usersCollection: process.env.APPWRITE_COLLECTION_USERS || 'users',
  ordersCollection: process.env.APPWRITE_COLLECTION_ORDERS || 'orders',
  jwtSecret: process.env.JWT_SECRET || 'change_this_in_production'
};

function createServices(req) {
  const apiKey = process.env.APPWRITE_API_KEY || req.headers['x-appwrite-key'];
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(apiKey);

  return {
    databases: new Databases(client),
    users: new Users(client)
  };
}

function response(res, status, body) {
  return res.json(body, status, jsonHeaders);
}

function getPath(req) {
  const rawPath = req.path || req.url || '/';
  return rawPath.replace(/^\/api/, '') || '/';
}

function getAuthUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  return jwt.verify(token, config.jwtSecret);
}

function normalizeDocument(doc) {
  return {
    ...doc,
    id: doc.$id
  };
}

async function getUserByEmail(databases, email) {
  const response = await databases.listDocuments(
    config.databaseId,
    config.usersCollection,
    [Query.equal('email', email)]
  );

  if (response.total === 0) return null;
  return normalizeDocument(response.documents[0]);
}

async function handleLogin(req, res, databases) {
  const { email, password } = req.bodyJson || {};
  if (!email || !password) {
    return response(res, 400, { success: false, message: 'Email and password are required' });
  }

  const user = await getUserByEmail(databases, email);
  if (!user || !user.password) {
    return response(res, 401, { success: false, message: 'Invalid credentials' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return response(res, 401, { success: false, message: 'Invalid credentials' });
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
}

async function handleRegister(req, res, services) {
  const { email, password, name, phone } = req.bodyJson || {};
  if (!email || !password || !name) {
    return response(res, 400, { success: false, message: 'Name, email, and password are required' });
  }

  const existing = await getUserByEmail(services.databases, email);
  if (existing) {
    return response(res, 409, { success: false, message: 'User already exists' });
  }

  const formattedPhone = phone && phone.trim().startsWith('+') ? phone.trim() : undefined;
  const authUser = await services.users.create(ID.unique(), email, formattedPhone, password, name);
  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

  await services.databases.createDocument(
    config.databaseId,
    config.usersCollection,
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
      role: 'user',
      emailVerification: authUser.emailVerification
    }
  });
}

async function handleMe(req, res, databases) {
  const decoded = getAuthUser(req);
  if (!decoded) {
    return response(res, 401, { success: false, message: 'Not authorized' });
  }

  const user = normalizeDocument(
    await databases.getDocument(config.databaseId, config.usersCollection, decoded.id)
  );

  return response(res, 200, {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeProduct(doc) {
  return {
    ...normalizeDocument(doc),
    images: parseJsonArray(doc.images),
    sizes: parseJsonArray(doc.sizes),
    colors: parseJsonArray(doc.colors),
    tags: parseJsonArray(doc.tags)
  };
}

async function handleProducts(req, res, databases) {
  const url = new URL(req.url || '/', 'https://function.local');
  const queries = [];

  const featured = url.searchParams.get('featured');
  const category = url.searchParams.get('category');
  const subCategory = url.searchParams.get('subCategory');
  const limit = Number(url.searchParams.get('limit') || 25);

  queries.push(Query.equal('isActive', true));
  if (featured === 'true') queries.push(Query.equal('featured', true));
  if (category) queries.push(Query.equal('category', category));
  if (subCategory) queries.push(Query.equal('subCategory', subCategory));
  queries.push(Query.limit(limit));

  const result = await databases.listDocuments(
    config.databaseId,
    config.productsCollection,
    queries
  );

  return response(res, 200, {
    success: true,
    data: result.documents.map(normalizeProduct),
    total: result.total,
    page: 1,
    totalPages: 1
  });
}

async function handleProductById(req, res, databases, productId) {
  const product = await databases.getDocument(
    config.databaseId,
    config.productsCollection,
    productId
  );

  return response(res, 200, {
    success: true,
    data: normalizeProduct(product)
  });
}

async function handleSubcategories(req, res, databases) {
  const result = await databases.listDocuments(
    config.databaseId,
    config.productsCollection,
    [Query.limit(100)]
  );

  const subcategories = [...new Set(
    result.documents
      .map((product) => product.subCategory)
      .filter(Boolean)
  )];

  return response(res, 200, {
    success: true,
    data: subcategories
  });
}

export default async function main({ req, res, error }) {
  if (req.method === 'OPTIONS') {
    return res.text('', 204, jsonHeaders);
  }

  try {
    if (!config.projectId || !config.databaseId) {
      return response(res, 500, {
        success: false,
        message: 'Missing Appwrite function environment variables'
      });
    }

    const path = getPath(req);
    const services = createServices(req);

    if (req.method === 'GET' && path === '/health') {
      return response(res, 200, { status: 'OK', message: 'AVENZA Appwrite Function API is running' });
    }

    if (req.method === 'POST' && path === '/auth/login') {
      return handleLogin(req, res, services.databases);
    }

    if (req.method === 'POST' && path === '/auth/register') {
      return handleRegister(req, res, services);
    }

    if (req.method === 'GET' && path === '/auth/me') {
      return handleMe(req, res, services.databases);
    }

    if (req.method === 'GET' && path === '/products') {
      return handleProducts(req, res, services.databases);
    }

    if (req.method === 'GET' && path === '/products/subcategories') {
      return handleSubcategories(req, res, services.databases);
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (req.method === 'GET' && productMatch) {
      return handleProductById(req, res, services.databases, productMatch[1]);
    }

    return response(res, 404, { success: false, message: `Route not found: ${req.method} ${path}` });
  } catch (err) {
    error(err.message);
    return response(res, err.code || 500, {
      success: false,
      message: err.message || 'Function execution failed'
    });
  }
}
