-- ============================================================
-- BANKING SCHEMA
-- ============================================================

CREATE TABLE bank_customers (
    customer_id   SERIAL PRIMARY KEY,
    full_name     VARCHAR(200) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    city          VARCHAR(100),
    kyc_status    VARCHAR(20) DEFAULT 'verified',
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE branches (
    branch_id     SERIAL PRIMARY KEY,
    branch_name   VARCHAR(200) NOT NULL,
    city          VARCHAR(100),
    region        VARCHAR(100),
    manager       VARCHAR(200)
);

CREATE TABLE accounts (
    account_id    SERIAL PRIMARY KEY,
    customer_id   INT REFERENCES bank_customers(customer_id),
    branch_id     INT REFERENCES branches(branch_id),
    account_type  VARCHAR(50), -- savings, current, fd
    balance       NUMERIC(15, 2) DEFAULT 0,
    opened_at     DATE DEFAULT CURRENT_DATE,
    status        VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE transactions (
    txn_id        SERIAL PRIMARY KEY,
    account_id    INT REFERENCES accounts(account_id),
    txn_date      TIMESTAMP DEFAULT NOW(),
    txn_type      VARCHAR(50), -- credit, debit
    amount        NUMERIC(15, 2) NOT NULL,
    category      VARCHAR(100), -- salary, shopping, transfer, utilities
    is_fraud      BOOLEAN DEFAULT FALSE,
    channel       VARCHAR(50)  -- atm, online, branch, upi
);

CREATE INDEX idx_txn_date    ON transactions(txn_date);
CREATE INDEX idx_txn_account ON transactions(account_id);
CREATE INDEX idx_txn_fraud   ON transactions(is_fraud);

-- ============================================================
-- LOGISTICS SCHEMA
-- ============================================================

CREATE TABLE drivers (
    driver_id     SERIAL PRIMARY KEY,
    driver_name   VARCHAR(200) NOT NULL,
    phone         VARCHAR(20),
    region        VARCHAR(100),
    rating        NUMERIC(3,2) DEFAULT 4.5
);

CREATE TABLE routes (
    route_id      SERIAL PRIMARY KEY,
    origin        VARCHAR(200) NOT NULL,
    destination   VARCHAR(200) NOT NULL,
    distance_km   NUMERIC(8,2),
    estimated_hrs NUMERIC(5,2)
);

CREATE TABLE shipments (
    shipment_id     SERIAL PRIMARY KEY,
    order_id        INT REFERENCES orders(order_id),
    driver_id       INT REFERENCES drivers(driver_id),
    route_id        INT REFERENCES routes(route_id),
    shipped_at      TIMESTAMP,
    delivered_at    TIMESTAMP,
    status          VARCHAR(50) DEFAULT 'in_transit', -- in_transit, delivered, failed
    shipping_cost   NUMERIC(10, 2)
);

CREATE TABLE delivery_events (
    event_id      SERIAL PRIMARY KEY,
    shipment_id   INT REFERENCES shipments(shipment_id),
    event_time    TIMESTAMP DEFAULT NOW(),
    event_type    VARCHAR(100), -- picked_up, in_transit, out_for_delivery, delivered, failed
    location      VARCHAR(200),
    notes         TEXT
);

CREATE INDEX idx_shipment_status ON shipments(status);
CREATE INDEX idx_shipment_driver ON shipments(driver_id);
