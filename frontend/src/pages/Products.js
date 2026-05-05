import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [subCategoriesMap, setSubCategoriesMap] = useState({});

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      category: params.get('category') || '',
      subCategory: params.get('subCategory') || '',
      search: params.get('search') || '',
      sort: params.get('sort') || '-createdAt',
      featured: params.get('featured') || '',
      page: params.get('page') || '1'
    };
  });

  // Sync state with URL changes (e.g., clicking navbar while on products page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters({
      category: params.get('category') || '',
      subCategory: params.get('subCategory') || '',
      search: params.get('search') || '',
      sort: params.get('sort') || '-createdAt',
      featured: params.get('featured') || '',
      page: params.get('page') || '1'
    });
  }, [location.search]);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/products/subcategories`);
        if (response.data.success) {
          setSubCategoriesMap(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
    fetchSubCategories();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [filters]);

    const fetchProducts = async (signal) => {
    setLoading(true);
    try {
      // Standard category/filter fetch using productService (handles search internally)
      const result = await productService.getProducts(filters);
      setProducts(result.data);
      setPagination(result.pagination || {
          page: result.page || 1,
          total: result.total || result.data.length,
          pages: result.totalPages || 1
      });
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'category') newFilters.subCategory = '';
    // Reset to page 1 on filter change, unless we're actually changing the page
    if (key !== 'page') newFilters.page = '1';
    
    // Update URL as well
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k]) params.append(k, newFilters[k]);
    });
    navigate(`/products?${params.toString()}`);
  };

  const categories = ['Men', 'Women', 'Accessories', 'Jerseys'];
  
  const getSubCategories = (category) => {
    const cat = categories.find(c => c.toLowerCase() === category?.toLowerCase());
    if (!cat) return [];
    
    return subCategoriesMap[cat] || [];
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: '-name', label: 'Name: Z to A' }
  ];

  const activeCategory = categories.find(c => c.toLowerCase() === filters.category?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Back Button and Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-primary-600 transition-colors font-medium group"
          >
            <svg className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
          
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-gray-700">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Shop</li>
              {filters.category && (
                <>
                  <li className="text-gray-400">/</li>
                  <li className="text-gray-900 font-medium">{filters.category}</li>
                </>
              )}
            </ol>
          </nav>
        </div>

        {/* Retro Kits LK Poster */}
        {filters.category?.toLowerCase() === 'jerseys' && (
          <div className="relative w-full h-[500px] md:h-[600px] mb-12 rounded-[40px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] group animate-fade-in">
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src="/images/jersey_collection_poster.png" 
                alt="Retro Kits LK Partnership" 
                className="w-full h-full object-cover transition-transform duration-[15s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/40 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative h-full flex flex-col justify-center px-8 md:px-20 max-w-4xl text-left py-12">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-500/10 border border-secondary-500/30 text-secondary-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-6 backdrop-blur-md w-fit">
                Strategic Alliance • 2026
              </div>
              
              <h2 className="text-5xl md:text-7xl font-serif font-black text-white mb-6 leading-[1.1]">
                Now we are partnered with<br />
                <span className="text-secondary-500 italic drop-shadow-sm">RETRO KITS LK.</span>
              </h2>
              
              <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed tracking-wide mb-8 drop-shadow-md max-w-2xl">
                We are proud to announce our official partnership with RETRO KITS LK, bringing you the most exclusive and authentic soccer jersey collection. From legendary classics to the latest match-day kits, experience the pinnacle of sports heritage.
              </p>
              
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => document.getElementById('product-grid').scrollIntoView({ behavior: 'smooth' })}
                  className="btn-silver px-12 py-5 rounded-full uppercase tracking-widest text-[11px]"
                >
                  View Collection
                </button>
                <button className="px-12 py-5 bg-white/5 border border-white/20 text-white rounded-full uppercase tracking-widest text-[11px] font-bold hover:bg-white/10 transition-all backdrop-blur-sm">
                  Our Story
                </button>
              </div>
            </div>
            
            {/* Visual accents */}
            <div className="absolute top-0 right-0 p-8">
              <div className="w-24 h-24 border-t-2 border-r-2 border-white/10 rounded-tr-3xl"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary-500 via-primary-500 to-transparent opacity-80"></div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              {filters.search ? `Search: "${filters.search}"` : 
               filters.sort === '-createdAt' && !filters.category ? 'New Arrivals' :
               filters.subCategory ? `${filters.category} - ${filters.subCategory}` :
               filters.category ? filters.category : 
               'All Products'}
            </h1>
            <p className="text-gray-600">
              {pagination.total ? `Showing ${products.length} of ${pagination.total} products` : 'Browse our collection'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
              <button
                onClick={() => setFilters({
                  category: '',
                  subCategory: '',
                  search: '',
                  sort: '-createdAt'
                })}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear Filters
              </button>

          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-8">
            {/* Sub Categories */}
            {activeCategory && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                  {activeCategory} Collection
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleFilterChange('subCategory', '')}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      filters.subCategory === '' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All {activeCategory}
                  </button>
                  {getSubCategories(activeCategory).map(sub => (
                    <button
                      key={sub}
                      onClick={() => handleFilterChange('subCategory', sub)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filters.subCategory === sub ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}



            {/* Filters placeholder */}

          </aside>

          {/* Product Grid */}
          <main className="flex-1">

            {loading ? (
              <div className="flex justify-center items-center py-24">
                <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div id="product-grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => (
                    <div key={product.id} className="product-card bg-white rounded-lg shadow-sm overflow-hidden">
                      <Link to={`/product/${product.id}`} className="block">
                        <div className="aspect-w-1 aspect-h-1">
                          <img
                            src={product.images?.[0]?.url 
                              ? `${process.env.REACT_APP_UPLOAD_URL}${product.images[0].url}`
                              : 'https://via.placeholder.com/300x300?text=No+Image'
                            }
                            alt={product.name}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      </Link>
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-gray-900">
                              LKR {product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="ml-2 text-sm text-gray-500 line-through">
                                LKR {product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {user?.role !== 'admin' && (
                            <button
                              onClick={() => addToCart(product)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                              title="Add to Cart"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center">
                    <nav className="flex items-center space-x-2">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handleFilterChange('page', page.toString())}
                          className={`px-4 py-2 rounded-lg ${
                            page === pagination.page
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
