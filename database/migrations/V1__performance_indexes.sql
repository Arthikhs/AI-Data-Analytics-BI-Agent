-- ============================================================
-- V1__performance_indexes.sql
-- Additional indexes for analytics query performance
-- ============================================================

-- E-Commerce: faster revenue aggregations
CREATE INDEX IF NOT EXISTS idx_orders_status_date
    ON orders(status, order_date);

CREATE INDEX IF NOT EXISTS idx_orders_region_date
    ON orders(region, order_date);

CREATE INDEX IF NOT EXISTS idx_orders_status_region
    ON orders(status, region);

-- E-Commerce: faster product/category joins
CREATE INDEX IF NOT EXISTS idx_products_category
    ON products(category_id);

-- E-Commerce: customer segment filtering
CREATE INDEX IF NOT EXISTS idx_customers_segment
    ON customers(segment);

CREATE INDEX IF NOT EXISTS idx_customers_acquired
    ON customers(acquired_at);

-- Banking: transaction date + type queries
CREATE INDEX IF NOT EXISTS idx_txn_type_date
    ON transactions(txn_type, txn_date);

CREATE INDEX IF NOT EXISTS idx_txn_fraud_date
    ON transactions(is_fraud, txn_date) WHERE is_fraud = TRUE;

-- Logistics: shipment status + date queries
CREATE INDEX IF NOT EXISTS idx_shipments_shipped_at
    ON shipments(shipped_at);

CREATE INDEX IF NOT EXISTS idx_shipments_status_shipped
    ON shipments(status, shipped_at);

CREATE INDEX IF NOT EXISTS idx_shipments_driver
    ON shipments(driver_id);

CREATE INDEX IF NOT EXISTS idx_shipments_route
    ON shipments(route_id);

-- Delivery events: event type lookups
CREATE INDEX IF NOT EXISTS idx_delivery_events_shipment
    ON delivery_events(shipment_id);

CREATE INDEX IF NOT EXISTS idx_delivery_events_type
    ON delivery_events(event_type);
