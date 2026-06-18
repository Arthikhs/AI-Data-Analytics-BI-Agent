-- ============================================================
-- E-COMMERCE SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE categories (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_id     INT REFERENCES categories(category_id),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    product_id    SERIAL PRIMARY KEY,
    product_name  VARCHAR(200) NOT NULL,
    category_id   INT REFERENCES categories(category_id),
    price         NUMERIC(12, 2) NOT NULL,
    cost          NUMERIC(12, 2) NOT NULL,
    stock         INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    customer_id   SERIAL PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    region        VARCHAR(100),
    city          VARCHAR(100),
    segment       VARCHAR(50) DEFAULT 'Regular', -- Regular, Premium, VIP
    acquired_at   DATE DEFAULT CURRENT_DATE,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    order_id      SERIAL PRIMARY KEY,
    customer_id   INT REFERENCES customers(customer_id),
    order_date    DATE NOT NULL,
    status        VARCHAR(50) DEFAULT 'completed', -- pending, processing, completed, cancelled
    total_amount  NUMERIC(12, 2) NOT NULL,
    discount      NUMERIC(12, 2) DEFAULT 0,
    region        VARCHAR(100),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    item_id       SERIAL PRIMARY KEY,
    order_id      INT REFERENCES orders(order_id),
    product_id    INT REFERENCES products(product_id),
    quantity      INT NOT NULL,
    unit_price    NUMERIC(12, 2) NOT NULL,
    amount        NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Payments
CREATE TABLE payments (
    payment_id     SERIAL PRIMARY KEY,
    order_id       INT REFERENCES orders(order_id),
    payment_date   TIMESTAMP DEFAULT NOW(),
    amount         NUMERIC(12, 2) NOT NULL,
    method         VARCHAR(50), -- credit_card, upi, net_banking, wallet
    status         VARCHAR(50) DEFAULT 'success'
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_date       ON orders(order_date);
CREATE INDEX idx_orders_customer   ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_prod  ON order_items(product_id);
CREATE INDEX idx_customers_region  ON customers(region);
CREATE INDEX idx_payments_order    ON payments(order_id);
