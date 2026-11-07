-- CATEGORIES
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Computer Accessories', 'Accessories for computers and workstations'),
('Office Equipment', 'Equipment for office and productivity');


-- PRODUCTS
INSERT INTO products
(category_id, name, description, price, stock, image_url, is_active)
VALUES

-- ELECTRONICS
(1, 'Wireless Headphones',
 'Wireless headphones with noise isolation.',
 2499.00, 25, NULL, TRUE),

(1, 'Bluetooth Speaker',
 'Portable Bluetooth speaker with clear audio.',
 1499.00, 18, NULL, TRUE),

(1, 'USB Flash Drive 64GB',
 'High-speed USB 3.0 flash drive.',
 399.00, 50, NULL, TRUE),

(1, 'Webcam HD',
 '1080p webcam for meetings and streaming.',
 1299.00, 12, NULL, TRUE),

-- COMPUTER ACCESSORIES
(2, 'Mechanical Keyboard',
 'Mechanical keyboard with RGB lighting.',
 1899.00, 15, NULL, TRUE),

(2, 'Wireless Mouse',
 'Ergonomic wireless mouse.',
 699.00, 30, NULL, TRUE),

(2, 'Laptop Stand',
 'Adjustable aluminum laptop stand.',
 899.00, 20, NULL, TRUE),

(2, 'USB-C Hub',
 'Multiport USB-C adapter.',
 1199.00, 0, NULL, TRUE),

-- OFFICE EQUIPMENT
(3, 'Office Chair',
 'Ergonomic office chair.',
 4599.00, 8, NULL, TRUE),

(3, 'Desk Lamp',
 'LED desk lamp with adjustable brightness.',
 799.00, 14, NULL, TRUE),

(3, 'Old Printer Model',
 'Discontinued printer model.',
 2999.00, 5, NULL, FALSE);


-- USERS (Default password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('System Administrator', 'admin@cubetech.com', '$2y$10$X6ydj7QMn7oqGVgl644XqeJzZkVaOrHnGprL3crLa1s/U.EbfuVzO', 'admin'),
('John Customer', 'john@example.com', '$2y$10$X6ydj7QMn7oqGVgl644XqeJzZkVaOrHnGprL3crLa1s/U.EbfuVzO', 'customer');
