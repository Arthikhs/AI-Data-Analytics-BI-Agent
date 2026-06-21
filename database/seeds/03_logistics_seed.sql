-- ============================================================
-- SEED DATA: Logistics
-- ============================================================

-- Drivers
INSERT INTO drivers (driver_name, phone, region, rating) VALUES
('Ramu Yadav',      '9700000001', 'North',  4.8),
('Suresh Pillai',   '9700000002', 'South',  4.6),
('Ajay Mishra',     '9700000003', 'West',   4.5),
('Kiran Patil',     '9700000004', 'West',   4.7),
('Deepak Singh',    '9700000005', 'North',  4.3),
('Manoj Kumar',     '9700000006', 'East',   4.9),
('Sanjay Rawat',    '9700000007', 'North',  4.2),
('Pradeep Nair',    '9700000008', 'South',  4.6),
('Ganesh Rao',      '9700000009', 'South',  4.8),
('Tushar Joshi',    '9700000010', 'West',   4.4);

-- Routes
INSERT INTO routes (origin, destination, distance_km, estimated_hrs) VALUES
('Mumbai',    'Delhi',      1400, 20),
('Bangalore', 'Chennai',     350,  6),
('Delhi',     'Jaipur',      280,  5),
('Mumbai',    'Pune',        150,  3),
('Hyderabad', 'Bangalore',   570,  9),
('Kolkata',   'Bhubaneswar', 440,  7),
('Chennai',   'Madurai',     460,  7),
('Delhi',     'Lucknow',     550,  8),
('Mumbai',    'Ahmedabad',   530,  8),
('Bangalore', 'Hyderabad',   570, 10);

-- Shipments (2024, linked to ecommerce orders 1-38)
INSERT INTO shipments (order_id, driver_id, route_id, shipped_at, delivered_at, status, shipping_cost) VALUES
(1,  1,  1, '2024-01-06 08:00:00', '2024-01-08 06:30:00', 'delivered', 1200.00),
(2,  2,  2, '2024-01-13 09:00:00', '2024-01-13 16:00:00', 'delivered',  450.00),
(3,  5,  8, '2024-01-19 07:30:00', '2024-01-20 16:00:00', 'delivered',  700.00),
(4,  9,  5, '2024-02-04 08:00:00', '2024-02-05 18:30:00', 'delivered',  850.00),
(5,  7,  8, '2024-02-15 09:30:00', NULL,                  'failed',     700.00),  -- FAILED
(6,  3,  9, '2024-02-21 08:00:00', '2024-02-22 18:00:00', 'delivered', 1100.00),
(7,  8,  2, '2024-03-02 07:00:00', '2024-03-02 14:30:00', 'delivered',  450.00),
(8,  2,  7, '2024-03-16 08:00:00', '2024-03-17 17:00:00', 'delivered',  800.00),
(9,  6,  6, '2024-03-23 09:00:00', '2024-03-24 17:30:00', 'delivered',  650.00),
(10, 4,  9, '2024-04-03 08:00:00', '2024-04-04 19:00:00', 'delivered', 1100.00),
(11, 5,  3, '2024-04-19 07:00:00', NULL,                  'failed',     600.00),  -- FAILED
(12, 9,  5, '2024-04-26 08:30:00', '2024-04-27 20:00:00', 'delivered',  850.00),  -- DELAYED
(13, 1,  1, '2024-05-06 08:00:00', '2024-05-08 07:00:00', 'delivered', 1200.00),
(14, 2,  2, '2024-05-21 09:00:00', '2024-05-21 15:30:00', 'delivered',  450.00),
(15, 3,  4, '2024-05-29 10:00:00', '2024-05-29 13:30:00', 'delivered',  350.00),
(16, 7,  8, '2024-06-09 07:30:00', '2024-06-10 17:00:00', 'delivered',  700.00),
(17, 6,  6, '2024-06-16 09:00:00', NULL,                  'failed',     650.00),  -- FAILED
(18, 4,  4, '2024-06-23 10:00:00', '2024-06-23 13:30:00', 'delivered',  350.00),
(19, 8,  2, '2024-07-04 08:00:00', '2024-07-04 15:00:00', 'delivered',  450.00),
(20, 10, 9, '2024-07-11 09:00:00', '2024-07-12 20:00:00', 'delivered', 1100.00),  -- DELAYED
(21, 5,  3, '2024-07-20 07:00:00', '2024-07-20 12:30:00', 'delivered',  600.00),
(22, 9,  2, '2024-07-29 08:00:00', '2024-07-29 14:00:00', 'delivered',  450.00),
(23, 1,  1, '2024-08-05 08:00:00', '2024-08-07 07:00:00', 'delivered', 1200.00),
(24, 3,  5, '2024-08-12 09:00:00', NULL,                  'failed',     850.00),  -- FAILED
(25, 7,  8, '2024-08-21 07:30:00', '2024-08-22 18:00:00', 'delivered',  700.00),
(26, 2,  7, '2024-08-30 08:00:00', '2024-08-31 18:00:00', 'delivered',  800.00),
(27, 6,  6, '2024-09-07 09:00:00', NULL,                  'failed',     650.00),  -- FAILED
(28, 4,  4, '2024-09-14 10:00:00', '2024-09-14 13:30:00', 'delivered',  350.00),
(29, 1,  1, '2024-09-25 08:00:00', '2024-09-27 10:00:00', 'delivered', 1200.00),  -- DELAYED
(30, 10, 3, '2024-10-03 07:00:00', '2024-10-03 12:00:00', 'delivered',  600.00),
(31, 8,  2, '2024-10-16 08:00:00', '2024-10-16 15:00:00', 'delivered',  450.00),
(32, 5,  5, '2024-10-29 09:00:00', NULL,                  'failed',     850.00),  -- FAILED
(33, 9, 10, '2024-11-06 08:00:00', '2024-11-07 22:00:00', 'delivered', 1050.00),  -- DELAYED
(34, 3,  4, '2024-11-15 10:00:00', '2024-11-15 13:00:00', 'delivered',  350.00),
(35, 7,  8, '2024-11-23 07:30:00', '2024-11-24 17:00:00', 'delivered',  700.00),
(36, 2,  2, '2024-12-02 09:00:00', '2024-12-02 15:00:00', 'delivered',  450.00),
(37, 1,  1, '2024-12-11 08:00:00', '2024-12-13 09:00:00', 'delivered', 1200.00),
(38, 4,  9, '2024-12-19 08:00:00', '2024-12-20 19:00:00', 'delivered', 1100.00);

-- Delivery Events
INSERT INTO delivery_events (shipment_id, event_time, event_type, location, notes) VALUES
-- Shipment 1 (Mumbai→Delhi)
(1, '2024-01-06 08:00:00', 'picked_up',          'Mumbai Warehouse',  NULL),
(1, '2024-01-06 20:00:00', 'in_transit',          'Nashik',            NULL),
(1, '2024-01-07 14:00:00', 'in_transit',          'Agra',              NULL),
(1, '2024-01-08 06:30:00', 'delivered',           'Delhi Hub',         'On time'),
-- Shipment 2 (Bangalore→Chennai)
(2, '2024-01-13 09:00:00', 'picked_up',           'Bangalore Hub',     NULL),
(2, '2024-01-13 13:00:00', 'out_for_delivery',    'Chennai Outskirts', NULL),
(2, '2024-01-13 16:00:00', 'delivered',           'Chennai',           'On time'),
-- Shipment 5 (FAILED)
(5, '2024-02-15 09:30:00', 'picked_up',           'Delhi Warehouse',   NULL),
(5, '2024-02-15 17:00:00', 'in_transit',          'Moradabad',         NULL),
(5, '2024-02-16 08:00:00', 'failed',              'Lucknow Highway',   'Vehicle breakdown'),
-- Shipment 12 (DELAYED)
(12,'2024-04-26 08:30:00', 'picked_up',           'Hyderabad Hub',     NULL),
(12,'2024-04-26 20:00:00', 'in_transit',          'Kurnool',           NULL),
(12,'2024-04-27 10:00:00', 'in_transit',          'Bellary',           'Road closure — rerouted'),
(12,'2024-04-27 20:00:00', 'delivered',           'Bangalore',         'Delayed: road closure'),
-- Shipment 17 (FAILED)
(17,'2024-06-16 09:00:00', 'picked_up',           'Kolkata Warehouse', NULL),
(17,'2024-06-16 18:00:00', 'in_transit',          'Cuttack',           NULL),
(17,'2024-06-17 06:00:00', 'failed',              'Bhubaneswar',       'Customer not available'),
-- Shipment 24 (FAILED)
(24,'2024-08-12 09:00:00', 'picked_up',           'Mumbai Hub',        NULL),
(24,'2024-08-12 20:00:00', 'in_transit',          'Pune',              NULL),
(24,'2024-08-13 10:00:00', 'failed',              'Hyderabad Highway', 'Accident — shipment damaged'),
-- Shipment 29 (DELAYED)
(29,'2024-09-25 08:00:00', 'picked_up',           'Mumbai Warehouse',  NULL),
(29,'2024-09-26 04:00:00', 'in_transit',          'Mathura',           'Traffic congestion'),
(29,'2024-09-26 20:00:00', 'in_transit',          'Delhi Outskirts',   NULL),
(29,'2024-09-27 10:00:00', 'delivered',           'Delhi',             'Delayed by 14 hours');
