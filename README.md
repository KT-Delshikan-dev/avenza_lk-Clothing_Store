# AVENZA - Clothing E-commerce Web Application

A full-stack e-commerce web application for a clothing store called "AVENZA". Built with React, Node.js, Express, and **Appwrite Cloud**.

![AVENZA](https://img.shields.io/badge/AVENZA-LK-primary)
![License](https://img.shields.io/badge/license-ISC-blue)

## Features

### User Features
- **User Authentication**: Register and login with Appwrite authentication
- **Product Browsing**: Browse clothing items with filtering and sorting
- **Search**: Full-text search across products
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Complete checkout with delivery address and payment selection
- **Order History**: View past orders and track status
- **Order Cancellation**: Users can cancel pending orders before they are confirmed
- **Bank Transfer Workflow**: Upload payment slips (receipts) directly during checkout for bank transfers

### Admin Features
- **Executive Dashboard**: Professional management console with real-time analytics (Revenue, Orders, User metrics)
- **Order Approval**: Review uploaded payment slips and approve orders with a single click
- **Product Management**: Full CRUD operations for products with multi-image support
- **Category Management**: Organized by Men, Women, Jerseys (National/Club), and Accessories
- **User Management**: Monitor user activity and manage roles
- **Payment Oversight**: Dedicated tab for monitoring and confirming transaction statuses

### Payment Options
- Cash on Delivery (COD)
- Card Payment (Secure OTP-verified flow)
- **Bank Transfer**: Integrated slip upload and admin verification workflow

### Additional Features
- Responsive design (mobile + desktop optimized)
- Dynamic "Newly Arrived" filters for admins
- Category-based browsing with support for customized sub-categories
- Professional typography using Google Fonts (Inter, Outfit)
- Dark-themed premium hero sections

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Axios
- Lucide Icons

### Backend
- Node.js & Express.js
- **Appwrite Cloud** (Database, Storage, Auth)
- Multer for local/hybrid file handling

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Appwrite Project (Cloud or Self-hosted)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KT-Delshikan-dev/avenza_lk-Clothing_Store.git
   cd avenza_lk-Clothing_Store
   ```

2. **Configure Backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with your Appwrite credentials:
   ```env
   PORT=5005
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   APPWRITE_DATABASE_ID=your_db_id
   APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
   ```

3. **Configure Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5005/api
   REACT_APP_UPLOAD_URL=http://localhost:5005
   ```

4. **Run the Application**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

## API Endpoints

### Orders & Payments
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/slip` - Upload payment receipt (User)
- `PUT /api/orders/:id/payment` - Confirm/Update payment status (Admin)
- `PUT /api/orders/:id/status` - Update shipping/order status (Admin)
- `GET /api/orders/admin/all` - Comprehensive order list for administration

### Products
- `GET /api/products` - Filtered product listing
- `POST /api/products` - Create new product with image uploads

## Styling

The application uses a premium design system:
- **Primary**: Deep Navy & Gold accents
- **Aesthetics**: Glassmorphism, smooth gradients, and professional typography
- **Responsive**: Fully optimized for all screen sizes

---

Built by AVENZA Team
