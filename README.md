# CubeTech E-Commerce Platform

A full-stack e-commerce web application developed as a technical assessment for CubeTech. The platform features a **React 19 (Vite + Tailwind CSS v4)** customer storefront and administrative portal, paired with a **native PHP 8.x + MySQL (PDO)** REST backend. It demonstrates role-based access control (RBAC), transactional order processing with pessimistic stock locking, pre-checkout price and stock validation, and administrative management for products, categories, orders, customers, and business metrics.

---

## Table of Contents

1. [Overview](#overview)
2. [Technologies](#technologies)
3. [Chosen Storage Approach and Limitations](#chosen-storage-approach-and-limitations)
4. [Environment Placeholders](#environment-placeholders)
5. [Install and Run Steps](#install-and-run-steps)
6. [Database Seed and Reset Instructions](#database-seed-and-reset-instructions)
7. [Customer and Admin Routes](#customer-and-admin-routes)
8. [Demo Credentials](#demo-credentials)
9. [API Reference](#api-reference)
10. [Order Lifecycle State Machine](#order-lifecycle-state-machine)

---

## Overview

CubeTech is an online computer hardware, workstation peripherals, and tech gear store designed with strict data integrity, security, and responsive UI principles:

- **Customer Storefront:** Allows customers to browse products, filter by category, sort by price, view detailed product specifications, add items to an authenticated shopping cart, review real-time price and stock updates prior to payment, and place orders via Cash on Delivery (COD) or GCash.
- **Admin Management Portal:** Provides administrative staff with a real-time KPI metrics dashboard, product inventory CRUD, category management with referential integrity safeguards, customer directory analytics, and strict forward-only order status transitions.
- **Security & Authorization:** Role-based access control divides the application into Public, Customer, and Administrator areas. Native PHP session management with BCrypt password hashing guarantees session integrity.

---

## Technologies

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 19 | Client-rendered Single Page Application built with Vite 8 |
| **Styling** | Tailwind CSS v4 | Utility-first CSS styling using native CSS imports (`@import "tailwindcss"`) |
| **Routing** | React Router v7 | Client-side routing with nested layouts and RBAC route guards (`ProtectedRoute`) |
| **Icons** | Lucide React | Modern, lightweight icon suite |
| **State Management** | React Context API | Context providers for authentication (`AuthContext`) and cart state (`CartContext`) |
| **Backend Runtime** | PHP 8.x | Native Object-Oriented PHP without external web frameworks |
| **Package Autoloading** | Composer | PSR-4 autoloading (`src/` namespace) and dependency management |
| **Environment Config** | `vlucas/phpdotenv` | Environment variable loader from root `.env` |
| **Database** | MySQL 8.x (or MariaDB 10.4+) | Relational database utilizing InnoDB storage engine |
| **Database Access** | PHP Data Objects (PDO) | Prepared statements, parameterized queries, and ACID transactions |
| **Authentication** | PHP Session (`PHPSESSID`) | Session-based authentication using `password_hash()` and `password_verify()` |

---

## Chosen Storage Approach and Limitations

### Chosen Storage Architecture

1. **Relational MySQL Database (InnoDB Engine):**
   - **ACID Transactional Guarantees:** Order creation, stock reservation, and cancellation restocks run inside atomic transactions (`beginTransaction`, `commit`, `rollBack`).
   - **Pessimistic Concurrency Control:** Checkout operations utilize `SELECT stock, price FROM products WHERE id = ? FOR UPDATE` row-level locks to prevent overselling under concurrent requests.
   - **Referential Integrity:** Foreign key constraints (`ON DELETE RESTRICT`) prevent deleting categories or products currently associated with existing customer order records.
   - **Denormalized Customer Order Snapshots:** Customer name, contact number, and delivery address are captured on the `orders` record at checkout to preserve accurate historical invoices even if a user subsequently modifies their profile.

2. **Client-Side Cart Storage (`localStorage`):**
   - Cart contents are persisted locally using user-scoped storage keys (`cubetech-cart_${user.id}`).
   - Cart access is restricted strictly to authenticated customers. Unauthenticated visitors are guided to sign in before adding items to their cart.
   - Logging out automatically isolates and resets the in-memory cart state, preventing session leakage between users on shared workstations.

3. **Server Session Storage:**
   - User authentication state is maintained via native PHP server sessions identified by secure, HttpOnly session cookies.

### Architectural Limitations

- **Horizontal Session Scalability:** Native PHP file-based sessions reside on the local server filesystem. Scaling out across multiple load-balanced web servers would require migrating session handling to a centralized cache (such as Redis or Memcached).
- **Cross-Device Cart Synchronization:** Shopping cart items are stored in client-side `localStorage`. Items added on one browser or device do not synchronize to another device until the order is submitted.
- **Media / Asset Storage:** Product images currently rely on external URL references stored as strings in MySQL. There is no binary file upload handler or object storage integration (such as Amazon S3 or Cloudflare R2).
- **High-Concurrency Contention:** High-frequency checkout traffic targeting the exact same product SKU relies on row-level database locks, which serializes throughput for that specific item under heavy load.

---

## Environment Placeholders

The backend reads configuration settings from `cubetech-ecommerce/backend/.env`. Create this file based on the provided template:

```env
APP_ENV=local
APP_DEBUG=true

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cubetect-db
DB_USER=root
DB_PASSWORD=
```

### Variable Descriptions

| Variable | Description | Default / Example |
|---|---|---|
| `APP_ENV` | Application environment identifier | `local` |
| `APP_DEBUG` | Enables or disables verbose error reporting | `true` |
| `DB_HOST` | MySQL database host address | `127.0.0.1` |
| `DB_PORT` | MySQL database listening port | `3306` |
| `DB_NAME` | Database schema name | `cubetect-db` |
| `DB_USER` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | *(empty for default local setups)* |

---

## Install and Run Steps

### Prerequisites

Ensure the following tools are installed on your workstation:
- **PHP** 8.1 or higher with `pdo_mysql` and `mbstring` extensions enabled
- **Composer** (PHP dependency manager)
- **Node.js** 18.x or higher with **npm**
- **MySQL** 8.0 or higher (or MariaDB 10.4+)

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd cubetech-ecommerce/backend
   ```

2. Install Composer dependencies:
   ```bash
   composer install
   ```

3. Initialize your environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to verify your local database credentials.*

4. Launch the PHP development server on port 8000:
   ```bash
   php -S localhost:8000 -t public
   ```
   *The backend REST API will be accessible at `http://localhost:8000/api`.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd cubetech-ecommerce/frontend
   ```

2. Install Node.js packages:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```

4. Access the web application:
   - **Storefront:** [http://localhost:5173](http://localhost:5173)
   - **Admin Portal:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## Database Seed and Reset Instructions

### Initial Database Setup

1. Start your local MySQL database service (e.g., via XAMPP, Homebrew, or system service).

2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS `cubetect-db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Import the table schema and seed catalog:
   ```bash
   mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/schema.sql
   mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/seed.sql
   ```

---

### Full Database Reset Instructions

To wipe all transactional orders and reset the database to a clean testing state:

```bash
# Option A: MySQL Command-Line Client
mysql -u root -p -e "DROP DATABASE IF EXISTS \`cubetect-db\`; CREATE DATABASE \`cubetect-db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/schema.sql
mysql -u root -p cubetect-db < cubetech-ecommerce/backend/database/seed.sql
```

```powershell
# Option B: Windows PowerShell
Get-Content cubetech-ecommerce\backend\database\schema.sql | mysql -u root -p cubetect-db
Get-Content cubetech-ecommerce\backend\database\seed.sql | mysql -u root -p cubetect-db
```

---

## Customer and Admin Routes

### Customer Storefront Routes

| Route | Access Level | Description |
|---|---|---|
| `/` | Public | Storefront landing page featuring hero showcase and product categories |
| `/products` | Public | Searchable product catalog with category filter and price sorting |
| `/products/:id` | Public | Individual product specification page with related items |
| `/login` | Public | Customer account login interface |
| `/register` | Public | New customer registration form |
| `/cart` | Customer | Shopping cart view with quantity controls (requires authentication) |
| `/checkout` | Customer | Order checkout form, review banner, and order confirmation |
| `/orders` | Customer | Order history list with status badges and details link |
| `/orders/:id` | Customer | Individual order receipt with line items and delivery status |

---

### Admin Management Routes

All administrative routes require authentication with the `admin` role. Unauthorized access attempts are automatically redirected to `/admin/login`.

| Route | Access Level | Description |
|---|---|---|
| `/admin/login` | Public | Administrator login portal |
| `/admin` or `/admin/dashboard` | Admin | Real-time analytics, revenue metrics, and inventory alerts |
| `/admin/orders` | Admin | Comprehensive order listing with status filtering and inspection |
| `/admin/orders/:id` | Admin | Detailed order view, status progression, and cancellation controls |
| `/admin/products` | Admin | Inventory table, product creation, stock updates, and status toggles |
| `/admin/categories` | Admin | Category creation, editing, and deletion with product dependency checks |
| `/admin/customers` | Admin | Read-only customer directory aggregated from completed orders |

---

## Demo Credentials

The database seed script initializes ready-to-use accounts for testing:

### Administrator Account
- **Email:** `admin@cubetech.com`
- **Password:** `admin123`
- **Role:** `admin`
- **Portal URL:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

### Customer Account
- **Email:** `john@example.com`
- **Password:** `admin123`
- **Role:** `customer`
- **Storefront URL:** [http://localhost:5173/login](http://localhost:5173/login)

*Note: New customer accounts can also be created freely via the [Sign Up page](http://localhost:5173/register).*

---

## API Reference

### Authentication Endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new customer profile |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and create session |
| `POST` | `/api/auth/logout` | Authenticated | Destroy session and clear authentication cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session profile and role |

### Product Endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/products` | Public | List active products for customer catalog |
| `GET` | `/api/products/{id}` | Public | Retrieve single active product details |
| `GET` | `/api/admin/products` | Admin | List all products (active and inactive) |
| `POST` | `/api/admin/products` | Admin | Create a new product record |
| `PUT` | `/api/admin/products/{id}` | Admin | Update product details, price, or stock |
| `DELETE` | `/api/admin/products/{id}` | Admin | Delete product (rejected if referenced by existing orders) |

### Category Endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all product categories |
| `GET` | `/api/categories/{id}` | Public | Retrieve single category details |
| `POST` | `/api/admin/categories` | Admin | Create a new category |
| `PUT` | `/api/admin/categories/{id}` | Admin | Update category name and description |
| `DELETE` | `/api/admin/categories/{id}` | Admin | Delete category (rejected if products are assigned) |

### Order & Checkout Endpoints
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/orders/review` | Customer | Validate cart items against live database price and stock |
| `POST` | `/api/orders` | Customer | Create order and atomically deduct stock |
| `GET` | `/api/orders` | Customer | Retrieve all orders placed by the authenticated customer |
| `GET` | `/api/orders/{id}` | Customer | Retrieve customer order details and invoice |
| `GET` | `/api/admin/orders` | Admin | Retrieve all orders with newest records first |
| `GET` | `/api/admin/orders/{id}` | Admin | Retrieve complete order line items and customer contact |
| `PUT` | `/api/admin/orders/{id}/status` | Admin | Advance order status along validated state machine |
| `POST` | `/api/admin/orders/{id}/cancel` | Admin | Cancel order and automatically restore inventory |

### Admin Dashboard & Customer Management
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Retrieve revenue totals, order funnel, and stock alerts |
| `GET` | `/api/admin/customers` | Admin | Retrieve aggregated unique customer directory |
| `GET` | `/api/admin/customers/{email}/orders` | Admin | Retrieve order history for a specific customer email |

---

## Order Lifecycle State Machine

Order statuses follow a forward-only transition sequence:

```text
[ Pending ] --------> [ Confirmed ] --------> [ Preparing ] --------> [ Shipped ] --------> [ Completed ]
     |                      |
     v                      v
[ Cancelled ]          [ Cancelled ]
(Restores Stock)       (Restores Stock)
```

- **Valid Next Transitions:**
  - `Pending` -> `Confirmed` or `Cancelled`
  - `Confirmed` -> `Preparing` or `Cancelled`
  - `Preparing` -> `Shipped` (Cancellation blocked)
  - `Shipped` -> `Completed` (Cancellation blocked)
  - `Completed` -> Terminal status (No further transitions allowed)
  - `Cancelled` -> Terminal status (No further transitions allowed)
- **Stock Restoration Guarantee:** Inventory is restored to the database exactly once when transitioning into `Cancelled`. Subsequent operations cannot double-restock.
