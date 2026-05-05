const productService = require('../services/productService');

/**
 * Product Controller
 * Interacts with the service layer and handles HTTP responses.
 */

const productController = {
    /**
     * Get all products
     */
    async getProducts(req, res) {
        try {
            const { category, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const result = await productService.getProducts({
                category,
                minPrice,
                maxPrice,
                search,
                limit: parseInt(limit),
                offset
            });

            res.json({
                success: true,
                data: result.products,
                total: result.total,
                page: parseInt(page),
                totalPages: Math.ceil(result.total / limit)
            });
        } catch (error) {
            console.error('Error in getProducts:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
        }
    },

    /**
     * Get single product
     */
    async getProductById(req, res) {
        try {
            const product = await productService.getSingleProduct(req.params.id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            res.json({ success: true, data: product });
        } catch (error) {
            console.error('Error in getProductById:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
        }
    },

    /**
     * Create product
     */
    async createProduct(req, res) {
        try {
            const productData = { ...req.body };

            // Process uploaded images
            if (req.files && req.files.length > 0) {
                const images = req.files.map(file => ({
                    url: `/uploads/${file.filename}`,
                    alt: `${productData.name || 'Product'} image`
                }));
                productData.images = images;
            }

            // Parse JSON strings from form-data
            if (typeof productData.sizes === 'string' && productData.sizes !== 'undefined') {
                try { productData.sizes = JSON.parse(productData.sizes); } catch(e) {}
            }
            if (typeof productData.colors === 'string' && productData.colors !== 'undefined') {
                try { productData.colors = JSON.parse(productData.colors); } catch(e) {}
            }
            if (typeof productData.tags === 'string' && productData.tags !== 'undefined') {
                try { productData.tags = JSON.parse(productData.tags); } catch(e) {}
            }
            if (typeof productData.images === 'string' && productData.images !== 'undefined') {
                try { productData.images = JSON.parse(productData.images); } catch(e) {}
            }
            
            // Handle booleans
            if (productData.featured === 'true') productData.featured = true;
            if (productData.featured === 'false') productData.featured = false;
            if (productData.isActive === 'true') productData.isActive = true;
            if (productData.isActive === 'false') productData.isActive = false;
            if (productData.excludeFromNewArrivals === 'true') productData.excludeFromNewArrivals = true;
            if (productData.excludeFromNewArrivals === 'false') productData.excludeFromNewArrivals = false;

            // Handle numbers
            if (productData.price !== undefined && productData.price !== '') {
                productData.price = parseFloat(productData.price);
            }
            if (productData.originalPrice !== undefined && productData.originalPrice !== '' && productData.originalPrice !== null) {
                productData.originalPrice = parseFloat(productData.originalPrice);
            } else {
                delete productData.originalPrice; // Remove if empty or null to avoid Appwrite errors
            }
            if (productData.stock !== undefined && productData.stock !== '') {
                productData.stock = parseInt(productData.stock) || 0;
            } else {
                productData.stock = 0;
            }

            // Ensure booleans are actually booleans and not strings or missing
            productData.featured = productData.featured === 'true' || productData.featured === true;
            productData.isActive = productData.isActive === 'true' || productData.isActive === true || productData.isActive === undefined; // Default to true
            productData.excludeFromNewArrivals = productData.excludeFromNewArrivals === 'true' || productData.excludeFromNewArrivals === true;

            // Whitelist allowed fields for Appwrite
            const allowedFields = [
                'name', 'description', 'price', 'originalPrice', 'category', 
                'subCategory', 'images', 'sizes', 'colors', 'stock', 
                'sku', 'tags', 'featured', 'isActive', 'excludeFromNewArrivals'
            ];
            
            const filteredData = {};
            allowedFields.forEach(field => {
                if (productData[field] !== undefined) {
                    filteredData[field] = productData[field];
                }
            });

            const product = await productService.createProduct(filteredData);
            res.status(201).json({ success: true, message: 'Product created successfully', data: product });
        } catch (error) {
            console.error('Error in createProduct:', error);
            res.status(400).json({ success: false, message: 'Failed to create product', error: error.message });
        }
    },

    /**
     * Update product
     */
    async updateProduct(req, res) {
        try {
            const productData = { ...req.body };
            const existingProduct = await productService.getSingleProduct(req.params.id);
            
            if (!existingProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Handle new image uploads
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map(file => ({
                    url: `/uploads/${file.filename}`,
                    alt: `${productData.name || existingProduct.name} image`
                }));
                
                // Append or replace? Admin.js appends new images to existing ones.
                const currentImages = Array.isArray(existingProduct.images) ? existingProduct.images : [];
                productData.images = [...currentImages, ...newImages];
            }

            // Parse JSON strings from form-data
            if (typeof productData.sizes === 'string' && productData.sizes !== 'undefined') {
                try { productData.sizes = JSON.parse(productData.sizes); } catch(e) {}
            }
            if (typeof productData.colors === 'string' && productData.colors !== 'undefined') {
                try { productData.colors = JSON.parse(productData.colors); } catch(e) {}
            }
            if (typeof productData.tags === 'string' && productData.tags !== 'undefined') {
                try { productData.tags = JSON.parse(productData.tags); } catch(e) {}
            }
            if (typeof productData.images === 'string' && productData.images !== 'undefined') {
                try { productData.images = JSON.parse(productData.images); } catch(e) {}
            }

            // Handle booleans
            if (productData.featured === 'true') productData.featured = true;
            if (productData.featured === 'false') productData.featured = false;
            if (productData.isActive === 'true') productData.isActive = true;
            if (productData.isActive === 'false') productData.isActive = false;
            if (productData.excludeFromNewArrivals === 'true') productData.excludeFromNewArrivals = true;
            if (productData.excludeFromNewArrivals === 'false') productData.excludeFromNewArrivals = false;

            // Handle numbers
            if (productData.price !== undefined) {
                if (productData.price !== '' && productData.price !== null) {
                    productData.price = parseFloat(productData.price);
                } else {
                    productData.price = undefined; // Don't update if empty
                }
            }
            if (productData.originalPrice !== undefined) {
                if (productData.originalPrice !== '' && productData.originalPrice !== null) {
                    productData.originalPrice = parseFloat(productData.originalPrice);
                } else {
                    productData.originalPrice = undefined; // Don't update if empty
                }
            }
            if (productData.stock !== undefined) {
                if (productData.stock !== '' && productData.stock !== null) {
                    productData.stock = parseInt(productData.stock) || 0;
                } else {
                    productData.stock = undefined; // Don't update if empty
                }
            }

            const allowedFields = [
                'name', 'description', 'price', 'originalPrice', 'category', 
                'subCategory', 'images', 'sizes', 'colors', 'stock', 
                'sku', 'tags', 'featured', 'isActive', 'excludeFromNewArrivals'
            ];

            // Merge with existing product data for partial updates
            const updateData = { ...existingProduct };
            allowedFields.forEach(field => {
                if (productData[field] !== undefined) {
                    updateData[field] = productData[field];
                }
            });

            // Whitelist allowed fields for Appwrite
            const filteredData = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            });

            const product = await productService.updateProduct(req.params.id, filteredData);
            res.json({ success: true, message: 'Product updated successfully', data: product });
        } catch (error) {
            console.error('Error in updateProduct:', error);
            res.status(400).json({ success: false, message: 'Failed to update product', error: error.message });
        }
    },

    /**
     * Delete product
     */
    async deleteProduct(req, res) {
        try {
            await productService.deleteProduct(req.params.id);
            res.json({ success: true, message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Error in deleteProduct:', error);
            res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
        }
    },

    /**
     * Get all subcategories
     */
    async getSubcategories(req, res) {
        try {
            const data = await productService.getSubcategories();
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error in getSubcategories:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subcategories' });
        }
    },

    /**
     * Remove an image from a product
     */
    async removeProductImage(req, res) {
        try {
            const product = await productService.removeProductImage(req.params.id, req.params.index);
            res.json({ success: true, message: 'Image removed successfully', data: product });
        } catch (error) {
            console.error('Error in removeProductImage:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

module.exports = productController;
