-- ============================================================
-- SEED DATA: E-Commerce
-- ============================================================

-- Categories
INSERT INTO categories (category_name, parent_id) VALUES
('Electronics', NULL), ('Clothing', NULL), ('Home & Kitchen', NULL),
('Books', NULL), ('Sports', NULL), ('Beauty', NULL),
('Laptops', 1), ('Smartphones', 1), ('Televisions', 1),
('Men', 2), ('Women', 2);

-- Products
INSERT INTO products (product_name, category_id, price, cost, stock) VALUES
('MacBook Pro 14"',         7,  199999, 150000, 50),
('iPhone 15 Pro',           8,  134999, 95000,  80),
('Samsung Galaxy S24',      8,   89999, 62000,  120),
('Sony 55" OLED TV',        9,   89999, 65000,  30),
('Dell XPS 15',             7,  159999, 118000, 40),
('Nike Air Max 270',        10,  12999,  7000,  200),
('Levis 501 Jeans',         10,   4999,  2500,  300),
('Saree Silk Premium',      11,  15999,  9000,  80),
('Instant Pot 6QT',         3,   12999,  8000,  100),
('The Lean Startup',        4,     499,   200,  500),
('Yoga Mat Premium',        5,   2499,  1200,  250),
('Face Serum Vitamin C',    6,   1999,   800,  400),
('HP Pavilion Laptop',      7,  79999,  58000,  60),
('OnePlus 12',              8,  64999,  44000,  90),
('Noise-Cancelling Headset',1,   7999,  4200,  150);

-- Customers (30 sample customers)
INSERT INTO customers (first_name, last_name, email, phone, region, city, segment, acquired_at) VALUES
('Arjun',    'Sharma',    'arjun.sharma@example.com',    '9876543210', 'South',  'Bangalore',  'Premium', '2022-01-15'),
('Priya',    'Nair',      'priya.nair@example.com',      '9876543211', 'South',  'Chennai',    'VIP',     '2021-06-20'),
('Rahul',    'Gupta',     'rahul.gupta@example.com',     '9876543212', 'North',  'Delhi',      'Regular', '2022-03-10'),
('Sneha',    'Iyer',      'sneha.iyer@example.com',      '9876543213', 'South',  'Hyderabad',  'Premium', '2022-05-22'),
('Vikram',   'Singh',     'vikram.singh@example.com',    '9876543214', 'North',  'Lucknow',    'Regular', '2023-01-05'),
('Anjali',   'Verma',     'anjali.verma@example.com',    '9876543215', 'West',   'Mumbai',     'VIP',     '2021-11-30'),
('Kiran',    'Reddy',     'kiran.reddy@example.com',     '9876543216', 'South',  'Bangalore',  'Regular', '2023-03-18'),
('Meera',    'Pillai',    'meera.pillai@example.com',    '9876543217', 'South',  'Kochi',      'Premium', '2022-08-14'),
('Suresh',   'Kumar',     'suresh.kumar@example.com',    '9876543218', 'East',   'Kolkata',    'Regular', '2023-05-09'),
('Deepika',  'Patel',     'deepika.patel@example.com',   '9876543219', 'West',   'Ahmedabad',  'VIP',     '2021-09-25'),
('Rohit',    'Mishra',    'rohit.mishra@example.com',    '9876543220', 'North',  'Jaipur',     'Regular', '2023-07-11'),
('Kavya',    'Menon',     'kavya.menon@example.com',     '9876543221', 'South',  'Trivandrum', 'Premium', '2022-04-03'),
('Amit',     'Joshi',     'amit.joshi@example.com',      '9876543222', 'West',   'Pune',       'Regular', '2022-10-27'),
('Neha',     'Saxena',    'neha.saxena@example.com',     '9876543223', 'North',  'Agra',       'Regular', '2023-02-19'),
('Ravi',     'Tiwari',    'ravi.tiwari@example.com',     '9876543224', 'East',   'Patna',      'Regular', '2022-12-08'),
('Lakshmi',  'Subramaniam','lakshmi.sub@example.com',   '9876543225', 'South',  'Coimbatore', 'VIP',     '2021-07-14'),
('Sanjay',   'Kapoor',    'sanjay.kapoor@example.com',   '9876543226', 'North',  'Chandigarh', 'Premium', '2022-06-30'),
('Pooja',    'Shah',      'pooja.shah@example.com',      '9876543227', 'West',   'Surat',      'Regular', '2023-04-12'),
('Arun',     'Bose',      'arun.bose@example.com',       '9876543228', 'East',   'Bhubaneswar','Regular', '2023-06-25'),
('Divya',    'Krishnan',  'divya.krishnan@example.com',  '9876543229', 'South',  'Mysore',     'Premium', '2022-02-17'),
('Harish',   'Choudhary', 'harish.c@example.com',        '9876543230', 'North',  'Jodhpur',    'Regular', '2023-08-04'),
('Sunita',   'Rajan',     'sunita.rajan@example.com',    '9876543231', 'South',  'Madurai',    'Regular', '2022-09-21'),
('Manoj',    'Biswas',    'manoj.biswas@example.com',    '9876543232', 'East',   'Guwahati',   'Regular', '2023-01-30'),
('Rekha',    'Pillai',    'rekha.pillai@example.com',    '9876543233', 'South',  'Kochi',      'VIP',     '2021-05-18'),
('Prakash',  'Yadav',     'prakash.yadav@example.com',   '9876543234', 'North',  'Varanasi',   'Regular', '2022-11-09'),
('Anita',    'Desai',     'anita.desai@example.com',     '9876543235', 'West',   'Nashik',     'Premium', '2022-07-22'),
('Gopi',     'Nath',      'gopi.nath@example.com',       '9876543236', 'East',   'Ranchi',     'Regular', '2023-09-15'),
('Swati',    'Jain',      'swati.jain@example.com',      '9876543237', 'West',   'Indore',     'Regular', '2022-03-28'),
('Naresh',   'Pandey',    'naresh.pandey@example.com',   '9876543238', 'North',  'Allahabad',  'Regular', '2023-10-02'),
('Yasmin',   'Siddiqui',  'yasmin.s@example.com',        '9876543239', 'West',   'Mumbai',     'VIP',     '2021-12-14');

-- Orders (sample across 12 months)
INSERT INTO orders (customer_id, order_date, status, total_amount, discount, region) VALUES
(1,  '2024-01-05', 'completed', 199999, 5000,  'South'),
(2,  '2024-01-12', 'completed', 134999, 0,     'South'),
(3,  '2024-01-18', 'completed', 12999,  500,   'North'),
(4,  '2024-02-03', 'completed', 89999,  2000,  'South'),
(5,  '2024-02-14', 'completed', 4999,   0,     'North'),
(6,  '2024-02-20', 'completed', 159999, 10000, 'West'),
(7,  '2024-03-01', 'completed', 7999,   0,     'South'),
(8,  '2024-03-15', 'completed', 15999,  500,   'South'),
(9,  '2024-03-22', 'completed', 2499,   0,     'East'),
(10, '2024-04-02', 'completed', 64999,  1000,  'West'),
(11, '2024-04-18', 'completed', 1999,   0,     'North'),
(12, '2024-04-25', 'completed', 89999,  3000,  'South'),
(1,  '2024-05-05', 'completed', 134999, 5000,  'South'),
(2,  '2024-05-20', 'completed', 7999,   0,     'South'),
(13, '2024-05-28', 'completed', 12999,  0,     'West'),
(14, '2024-06-08', 'completed', 499,    0,     'North'),
(15, '2024-06-15', 'completed', 79999,  2000,  'East'),
(16, '2024-06-22', 'completed', 89999,  0,     'South'),
(17, '2024-07-03', 'completed', 12999,  500,   'North'),
(18, '2024-07-10', 'completed', 4999,   0,     'West'),
(19, '2024-07-19', 'completed', 15999,  1000,  'East'),
(20, '2024-07-28', 'completed', 1999,   0,     'South'),
(21, '2024-08-04', 'completed', 199999, 8000,  'North'),
(22, '2024-08-11', 'completed', 2499,   0,     'South'),
(23, '2024-08-20', 'completed', 64999,  2000,  'East'),
(24, '2024-08-29', 'completed', 89999,  0,     'South'),
(25, '2024-09-06', 'completed', 7999,   500,   'North'),
(26, '2024-09-13', 'completed', 12999,  0,     'West'),
(27, '2024-09-24', 'completed', 79999,  3000,  'East'),
(28, '2024-10-02', 'completed', 15999,  0,     'West'),
(29, '2024-10-15', 'completed', 134999, 5000,  'North'),
(30, '2024-10-28', 'completed', 4999,   0,     'West'),
(1,  '2024-11-05', 'completed', 159999, 7000,  'South'),
(2,  '2024-11-14', 'completed', 89999,  2000,  'South'),
(3,  '2024-11-22', 'completed', 64999,  1000,  'North'),
(4,  '2024-12-01', 'completed', 12999,  0,     'South'),
(5,  '2024-12-10', 'completed', 7999,   300,   'North'),
(6,  '2024-12-18', 'completed', 199999, 10000, 'West');

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1,  1,  1, 199999), (2,  2,  1, 134999), (3,  9,  1, 12999),
(4,  4,  1, 89999),  (5,  7,  1, 4999),   (6,  5,  1, 159999),
(7,  15, 1, 7999),   (8,  8,  1, 15999),  (9,  11, 1, 2499),
(10, 14, 1, 64999),  (11, 12, 1, 1999),   (12, 4,  1, 89999),
(13, 2,  1, 134999), (14, 15, 1, 7999),   (15, 9,  1, 12999),
(16, 10, 1, 499),    (17, 13, 1, 79999),  (18, 4,  1, 89999),
(19, 9,  1, 12999),  (20, 7,  1, 4999),   (21, 8,  1, 15999),
(22, 12, 1, 1999),   (23, 1,  1, 199999), (24, 11, 1, 2499),
(25, 14, 1, 64999),  (26, 4,  1, 89999),  (27, 15, 1, 7999),
(28, 9,  1, 12999),  (29, 13, 1, 79999),  (30, 8,  1, 15999),
(31, 7,  1, 4999),   (32, 2,  1, 134999), (33, 4,  1, 89999),
(34, 14, 1, 64999),  (35, 9,  1, 12999),  (36, 4,  1, 89999),
(37, 15, 1, 7999),   (38, 1,  1, 199999);

-- Payments
INSERT INTO payments (order_id, payment_date, amount, method, status)
SELECT order_id, order_date::TIMESTAMP, total_amount, 
  CASE (order_id % 4) WHEN 0 THEN 'credit_card' WHEN 1 THEN 'upi' WHEN 2 THEN 'net_banking' ELSE 'wallet' END,
  'success'
FROM orders;
