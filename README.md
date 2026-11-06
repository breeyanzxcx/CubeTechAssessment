# CubeTech E-Commerce Platform

A full-stack, enterprise-grade e-commerce web application built with a **React 19 (Vite + Tailwind CSS)** frontend and a **native PHP + MySQL (PDO)** backend. Designed for modern tech and workstation gear retail, featuring role-based access control (RBAC), transactional order management, pre-checkout price/stock validation, and an administrative dashboard.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture & Design Principles](#architecture--design-principles)
4. [Order Lifecycle State Machine](#order-lifecycle-state-machine)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Database Setup](#1-database-setup)
   - [Backend Setup](#2-backend-setup)
   - [Frontend Setup](#3-frontend-setup)
7. [API Reference](#api-reference)

---

## Features

### Customer Storefront
- **Modern Landing Page:** Hero showcase with CTA navigation, value proposition highlights, responsive category cards, and featured product listings.
- **Dynamic Product Catalog:**
  - Real-time client-side search by name and description.
  - Category filtering synced with URL search parameters (`?category=...`).
  - Price sorting (Low to High, High to Low).
  - Out-of-stock badges and inactive product isolation.
- **Detailed Product Pages:** High-resolution product showcase, category indicators, live stock counters, and related product recommendations.
- **Persistent Shopping Cart:**
  - Powered by React Context API and synchronized with `localStorage`.
  - Automatic duplicate product line merging.
  - Interactive quantity adjustments bounded by available stock.
  - Immediate visual feedback on actions (toast notifications and button states).
- **Pre-Checkout Price & Availability Review:**
  - Automatic verification against database records via `POST /api/orders/review`.
  - Detects and prompts customers about price changes, stock reductions, or unavailable items before submission.
  - One-click cart synchronization to accept updated items.
- **Secure Multi-Step Checkout:**
  - Customer ownership validation.
  - Cash on Delivery (COD), E-Wallet, and Direct Bank Transfer payment options.
  - Complete order confirmation summary with unique human-readable order numbers (e.g., `ORD-20261106-A1B2C`).

### Admin Management Portal
- **Role-Based Access Control (RBAC):** Dedicated administrative routes protected by backend session middleware and frontend route guards.
- **Business Intelligence Dashboard:**
  - Revenue calculation from non-cancelled orders.
  - Total order volume and pending order counters.
  - In-stock, low-stock ($\le 5$), and out-of-stock product tracking.
  - Status breakdown for all fulfillment stages.
  - Top-selling products and low-stock alerts.
- **End-to-End Order Management:**
  - Comprehensive order list with search and status tabs.
  - Detailed line-item inspect modal with customer contact, delivery info, and order notes.
  - Strict status progression controls (`Pending` $\rightarrow$ `Confirmed` $\rightarrow$ `Preparing` $\rightarrow$ `Shipped` $\rightarrow$ `Completed`).
  - Order cancellation limited to `Pending` and `Confirmed` statuses.
  - Guaranteed single inventory restoration upon order cancellation.
- **Product & Category CRUD:**
  - Full create, read, update, and delete endpoints.
  - Foreign key referential integrity protection (prevents deleting categories or products associated with existing orders).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7, Lucide Icons |
| **State Management** | React Context API (`AuthContext`, `CartContext`), `localStorage` |
| **Backend** | Native PHP 8.x (OOP, PSR-4 via Composer), `vlucas/phpdotenv` |
| **Database** | MySQL 8.x with PDO (Prepared Statements, Transactions, Row-level Locks) |
| **Authentication** | PHP Session-based Authentication with BCrypt Password Hashing |

---

## Architecture & Design Principles

1. **Transactional Integrity:** All checkout stock deductions, order creations, and cancellation restocks run inside atomic PDO transactions (`beginTransaction`, `commit`, `rollBack`). If any item validation fails, the entire transaction reverts.
2. **Server-Side Authoritative Pricing:** Client-submitted prices and totals are discarded. Prices, line totals, and order subtotals are computed strictly on the backend using database values.
3. **Optimistic UI with Defensive Server Guards:** The frontend prevents selecting quantities above known stock, while the backend verifies availability with `SELECT ... FOR UPDATE` locks.
4. **Data Isolation:** Inactive products (`is_active = 0`) are completely excluded from the storefront and customer detail endpoints. Customers can only view their own orders.

---

## Order Lifecycle State Machine

Order status transitions follow a strict forward-only progression to prevent invalid or out-of-order fulfillment states:

```
[ Pending ] --------> [ Confirmed ] --------> [ Preparing ] --------> [ Shipped ] --------> [ Completed ]
     |                      |
     v                      v
[ Cancelled ]          [ Cancelled ]
(Restores Stock)       (Restores Stock)
```

- **Valid Next Transitions:**
  - `Pending` $\rightarrow$ `Confirmed`, `Cancelled`
  - `Confirmed` $\rightarrow$ `Preparing`, `Cancelled`
  - `Preparing` $\rightarrow$ `Shipped` *(Cancellation blocked)*
  - `Shipped` $\rightarrow$ `Completed` *(Cancellation blocked)*
  - `Completed` $\rightarrow$ None *(Terminal)*
  - `Cancelled` $\rightarrow$ None *(Terminal)*
- **Cancellation Rule:** Allowed **only** when status is `Pending` or `Confirmed`. Product inventory is restored to MySQL exactly once.

---

## Project Structure

```text
CubeTechAssessment/
├── README.md                                # Root documentation
└── cubetech-ecommerce/
    ├── backend/                             # PHP REST API Backend
    │   ├── .env                             # Environment configuration (ignored in git)
    │   ├── .env.example                     # Environment template
    │   ├── composer.json                    # Composer dependencies & PSR-4 autoload
    │   ├── database/
    │   │   ├── schema.sql                   # Database DDL (tables, indexes, foreign keys)
    │   │   └── seed.sql                     # Initial categories and product catalog
    │   ├── public/
    │   │   └── index.php                    # Front controller, router, CORS, and dispatch
    │   └── src/
    │       ├── Config/
    │       │   └── Database.php             # PDO database connection manager
    │       ├── Controllers/
    │       │   ├── AuthController.php       # Authentication & session endpoints
    │       │   ├── CategoryController.php   # Category CRUD operations
    │       │   ├── DashboardController.php  # Admin analytics & business metrics
    │       │   ├── OrderController.php      # Checkout, order tracking, review, and status updates
    │       │   └── ProductController.php    # Product catalog and admin CRUD
    │       ├── Middleware/
    │       │   └── AuthMiddleware.php       # Session-based RBAC verification
    │       └── Utils/
    │           └── Session.php              # Session lifecycle helper
    │
    └── frontend/                            # React 19 Frontend
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── assets/                      # Hero and branding assets
            ├── components/
            │   └── ProtectedRoute.jsx       # RBAC route guard
            ├── context/
            │   ├── AuthContext.jsx          # Session state & auth operations
            │   └── CartContext.jsx          # Persistent shopping cart & toast provider
            ├── layouts/
            │   ├── AdminLayout.jsx          # Administrator dashboard layout
            │   └── CustomerLayout.jsx       # Responsive storefront layout & navigation
            ├── pages/
            │   ├── admin/
            │   │   ├── AdminOrderDetails.jsx # Detailed order view & status controls
            │   │   ├── AdminOrders.jsx      # Order list with filters & stats
            │   │   └── Login.jsx            # Admin login interface
            │   └── customer/
            │       ├── Cart.jsx             # Shopping cart view & quantity controls
            │       ├── Checkout.jsx         # Review banner & order submission
            │       ├── Home.jsx             # Customer homepage
            │       ├── Login.jsx            # Customer sign in
            │       ├── ProductDetails.jsx   # Single product view & stock alerts
            │       ├── Products.jsx         # Product catalog with search & filters
            │       └── Register.jsx         # Customer account creation
            ├── services/
            │   └── api.js                   # Unified fetch API client with credentials
            ├── App.jsx                      # Route configurations
            └── main.jsx                     # Application bootstrap
```

---

## Getting Started

### Prerequisites
- **PHP** $\ge$ 8.1 with `pdo_mysql` extension enabled
- **Composer** (PHP dependency manager)
- **Node.js** $\ge$ 18.x and **npm**
- **MySQL** $\ge$ 8.0 (or MariaDB $\ge$ 10.4)

---

### 1. Database Setup

1. Start your local MySQL server (e.g., via XAMPP, MySQL Workbench, or service).
2. Create the database:
   ```sql
   CREATE DATABASE `cubetect-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the database schema and seed records:
   ```bash
   mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/schema.sql
   mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/seed.sql
   ```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd cubetech-ecommerce/backend
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Configure environment variables in `.env` (copy from `.env.example` if needed):
   ```env
   APP_ENV=local
   APP_DEBUG=true

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=cubetect-db
   DB_USER=root
   DB_PASSWORD=
   ```
4. Start the backend development server on port 8000:
   ```bash
   php -S localhost:8000 -t public
   ```

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd cubetech-ecommerce/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   - **Storefront:** [http://localhost:5173](http://localhost:5173)
   - **Admin Portal:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## API Reference

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new customer account |
| `POST` | `/api/auth/login` | Public | Authenticate customer or administrator |
| `POST` | `/api/auth/logout` | Authenticated | Terminate session |
| `GET` | `/api/auth/me` | Authenticated | Fetch authenticated user profile |
| `GET` | `/api/admin/protected` | Admin | Verify administrative privileges |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | List active products for customer storefront |
| `GET` | `/api/products/{id}` | Public | View individual active product details |
| `GET` | `/api/admin/products` | Admin | List all products (active & inactive) with search and filters |
| `POST` | `/api/admin/products` | Admin | Create a new product |
| `PUT` | `/api/admin/products/{id}` | Admin | Update existing product details |
| `DELETE` | `/api/admin/products/{id}` | Admin | Delete product (restricted if referenced in orders) |

### Categories
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all categories with product counts |
| `GET` | `/api/categories/{id}` | Public | View single category details |
| `POST` | `/api/admin/categories` | Admin | Create a new category |
| `PUT` | `/api/admin/categories/{id}` | Admin | Update category details |
| `DELETE` | `/api/admin/categories/{id}` | Admin | Delete category (restricted if products exist) |

### Orders & Checkout
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/review` | Public / Customer | Review cart items against live prices and stock availability |
| `POST` | `/api/orders` | Customer | Submit order and atomically deduct stock |
| `GET` | `/api/orders/{id}` | Customer | View customer order details (ownership validated) |
| `GET` | `/api/admin/orders` | Admin | Retrieve all orders (newest first, with status filter) |
| `GET` | `/api/admin/orders/{id}` | Admin | View full order details and line items |
| `PUT` | `/api/admin/orders/{id}/status` | Admin | Advance order status along validated state machine |
| `POST` | `/api/admin/orders/{id}/cancel` | Admin | Cancel order and automatically restore product inventory |

### Admin Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Fetch sales totals, inventory alerts, and order breakdown |

---


**This project was developed as a technical assessment for CubeTech. All rights reserved.**