-- ============================================================
-- SEED DATA: Banking
-- ============================================================

-- Bank Customers
INSERT INTO bank_customers (full_name, email, phone, city, kyc_status) VALUES
('Rajesh Kumar',      'rajesh.kumar@bank.com',      '9800000001', 'Mumbai',      'verified'),
('Priya Sharma',      'priya.sharma@bank.com',      '9800000002', 'Delhi',       'verified'),
('Arun Nair',         'arun.nair@bank.com',         '9800000003', 'Bangalore',   'verified'),
('Sunita Reddy',      'sunita.reddy@bank.com',      '9800000004', 'Hyderabad',   'verified'),
('Mohan Patel',       'mohan.patel@bank.com',       '9800000005', 'Ahmedabad',   'pending'),
('Lakshmi Iyer',      'lakshmi.iyer@bank.com',      '9800000006', 'Chennai',     'verified'),
('Vikash Singh',      'vikash.singh@bank.com',      '9800000007', 'Lucknow',     'verified'),
('Deepa Menon',       'deepa.menon@bank.com',       '9800000008', 'Kochi',       'verified'),
('Suresh Joshi',      'suresh.joshi@bank.com',      '9800000009', 'Pune',        'verified'),
('Ananya Bose',       'ananya.bose@bank.com',       '9800000010', 'Kolkata',     'verified'),
('Harpreet Kaur',     'harpreet.kaur@bank.com',     '9800000011', 'Chandigarh',  'verified'),
('Ravi Tiwari',       'ravi.tiwari@bank.com',       '9800000012', 'Varanasi',    'verified'),
('Meenakshi Pillai',  'meenakshi.p@bank.com',       '9800000013', 'Madurai',     'verified'),
('Arjun Desai',       'arjun.desai@bank.com',       '9800000014', 'Surat',       'pending'),
('Kavitha Suresh',    'kavitha.s@bank.com',         '9800000015', 'Coimbatore',  'verified');

-- Branches
INSERT INTO branches (branch_name, city, region, manager) VALUES
('Mumbai Main Branch',    'Mumbai',    'West',  'Ramesh Agarwal'),
('Delhi Connaught Place', 'Delhi',     'North', 'Shalini Gupta'),
('Bangalore Koramangala', 'Bangalore', 'South', 'Prasad Rao'),
('Hyderabad Banjara Hills','Hyderabad','South', 'Nandini Reddy'),
('Chennai Anna Salai',    'Chennai',   'South', 'Muthu Krishnan'),
('Kolkata Park Street',   'Kolkata',   'East',  'Subhash Das'),
('Pune Shivajinagar',     'Pune',      'West',  'Anil Kulkarni'),
('Ahmedabad CG Road',     'Ahmedabad', 'West',  'Bhavin Shah');

-- Accounts
INSERT INTO accounts (customer_id, branch_id, account_type, balance, opened_at, status) VALUES
(1,  1, 'savings',  125000.00, '2020-03-15', 'active'),
(1,  1, 'fd',       500000.00, '2021-01-10', 'active'),
(2,  2, 'savings',   87500.00, '2019-07-22', 'active'),
(3,  3, 'current',  250000.00, '2020-11-05', 'active'),
(4,  4, 'savings',   45000.00, '2021-04-18', 'active'),
(5,  8, 'savings',   12000.00, '2022-02-28', 'active'),
(6,  5, 'savings',  310000.00, '2018-09-10', 'active'),
(7,  2, 'current',  180000.00, '2020-06-14', 'active'),
(8,  5, 'savings',   95000.00, '2021-08-30', 'active'),
(9,  7, 'savings',   67000.00, '2022-01-07', 'active'),
(10, 6, 'savings',  220000.00, '2019-12-20', 'active'),
(11, 2, 'fd',       750000.00, '2020-05-11', 'active'),
(12, 5, 'savings',   38000.00, '2022-06-15', 'active'),
(13, 5, 'current',  142000.00, '2021-03-22', 'active'),
(14, 8, 'savings',   29000.00, '2022-09-04', 'active'),
(15, 5, 'savings',  195000.00, '2020-10-17', 'active');

-- Transactions (2024 — mix of normal + fraud)
INSERT INTO transactions (account_id, txn_date, txn_type, amount, category, is_fraud, channel) VALUES
-- Jan 2024
(1,  '2024-01-03 09:15:00', 'credit', 85000.00,  'salary',    FALSE, 'online'),
(2,  '2024-01-05 14:30:00', 'debit',   3500.00,  'shopping',  FALSE, 'upi'),
(3,  '2024-01-08 11:00:00', 'credit', 120000.00, 'salary',    FALSE, 'online'),
(4,  '2024-01-10 16:45:00', 'debit',   8000.00,  'utilities', FALSE, 'online'),
(1,  '2024-01-12 10:00:00', 'debit',  25000.00,  'transfer',  FALSE, 'branch'),
(5,  '2024-01-15 08:30:00', 'credit',  45000.00, 'salary',    FALSE, 'online'),
(6,  '2024-01-18 13:20:00', 'debit',  12000.00,  'shopping',  FALSE, 'upi'),
(7,  '2024-01-20 17:00:00', 'debit',  95000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(8,  '2024-01-22 09:45:00', 'credit',  55000.00, 'salary',    FALSE, 'online'),
(9,  '2024-01-25 15:10:00', 'debit',   2200.00,  'utilities', FALSE, 'upi'),
-- Feb 2024
(1,  '2024-02-02 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(10, '2024-02-05 11:30:00', 'debit',   6500.00,  'shopping',  FALSE, 'atm'),
(2,  '2024-02-08 14:00:00', 'credit',  42000.00, 'salary',    FALSE, 'online'),
(11, '2024-02-10 16:15:00', 'debit',  18000.00,  'transfer',  FALSE, 'online'),
(3,  '2024-02-14 10:30:00', 'debit',  75000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(12, '2024-02-16 08:45:00', 'credit',  38000.00, 'salary',    FALSE, 'online'),
(4,  '2024-02-20 13:00:00', 'debit',   4000.00,  'utilities', FALSE, 'upi'),
(13, '2024-02-22 17:30:00', 'credit',  95000.00, 'salary',    FALSE, 'online'),
(5,  '2024-02-25 09:15:00', 'debit',   3200.00,  'shopping',  FALSE, 'atm'),
(6,  '2024-02-28 14:45:00', 'debit',   8500.00,  'utilities', FALSE, 'online'),
-- Mar 2024
(7,  '2024-03-03 10:00:00', 'credit', 180000.00, 'salary',    FALSE, 'online'),
(8,  '2024-03-05 12:30:00', 'debit',  55000.00,  'shopping',  FALSE, 'online'),
(9,  '2024-03-08 15:00:00', 'credit',  67000.00, 'salary',    FALSE, 'online'),
(10, '2024-03-12 09:45:00', 'debit',  12000.00,  'transfer',  FALSE, 'upi'),
(1,  '2024-03-15 11:15:00', 'debit', 180000.00,  'transfer',  TRUE,  'online'),  -- FRAUD (spike)
(2,  '2024-03-18 14:30:00', 'debit',   5500.00,  'utilities', FALSE, 'online'),
(11, '2024-03-20 16:00:00', 'credit', 750000.00, 'fd_maturity',FALSE,'branch'),
(12, '2024-03-25 08:30:00', 'debit',   7800.00,  'shopping',  FALSE, 'atm'),
(13, '2024-03-28 13:45:00', 'debit',  45000.00,  'transfer',  FALSE, 'online'),
-- Apr 2024
(1,  '2024-04-01 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(14, '2024-04-04 11:30:00', 'debit',   3800.00,  'shopping',  FALSE, 'upi'),
(15, '2024-04-08 14:00:00', 'credit',  95000.00, 'salary',    FALSE, 'online'),
(3,  '2024-04-11 16:30:00', 'debit',  22000.00,  'utilities', FALSE, 'online'),
(4,  '2024-04-15 10:15:00', 'debit',  85000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(5,  '2024-04-18 12:45:00', 'credit',  45000.00, 'salary',    FALSE, 'online'),
(6,  '2024-04-22 15:00:00', 'debit',  15000.00,  'shopping',  FALSE, 'online'),
(7,  '2024-04-25 09:30:00', 'debit',   4200.00,  'utilities', FALSE, 'upi'),
-- May 2024
(8,  '2024-05-02 10:00:00', 'credit',  55000.00, 'salary',    FALSE, 'online'),
(9,  '2024-05-06 13:15:00', 'debit',   9500.00,  'shopping',  FALSE, 'atm'),
(10, '2024-05-10 15:30:00', 'credit', 220000.00, 'salary',    FALSE, 'online'),
(11, '2024-05-14 08:45:00', 'debit',  35000.00,  'transfer',  FALSE, 'online'),
(12, '2024-05-18 11:00:00', 'credit',  38000.00, 'salary',    FALSE, 'online'),
(2,  '2024-05-22 14:15:00', 'debit',   6800.00,  'utilities', FALSE, 'upi'),
(13, '2024-05-26 16:45:00', 'debit',  48000.00,  'shopping',  FALSE, 'online'),
-- Jun 2024
(1,  '2024-06-03 09:15:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(14, '2024-06-07 12:00:00', 'debit',   5100.00,  'shopping',  FALSE, 'upi'),
(15, '2024-06-11 14:30:00', 'debit',  28000.00,  'transfer',  FALSE, 'online'),
(3,  '2024-06-15 10:45:00', 'credit', 120000.00, 'salary',    FALSE, 'online'),
(4,  '2024-06-19 13:00:00', 'debit',   7200.00,  'utilities', FALSE, 'online'),
(5,  '2024-06-23 15:30:00', 'debit',  42000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(6,  '2024-06-27 08:15:00', 'credit', 310000.00, 'salary',    FALSE, 'online'),
-- Jul 2024
(7,  '2024-07-02 10:30:00', 'credit', 180000.00, 'salary',    FALSE, 'online'),
(8,  '2024-07-05 13:45:00', 'debit',  12500.00,  'shopping',  FALSE, 'atm'),
(9,  '2024-07-09 16:00:00', 'debit',   3900.00,  'utilities', FALSE, 'upi'),
(10, '2024-07-13 09:15:00', 'credit',  50000.00, 'transfer',  FALSE, 'online'),
(1,  '2024-07-17 11:30:00', 'debit',  35000.00,  'shopping',  FALSE, 'online'),
(2,  '2024-07-21 14:45:00', 'credit',  42000.00, 'salary',    FALSE, 'online'),
(11, '2024-07-25 08:00:00', 'debit',  95000.00,  'transfer',  FALSE, 'branch'),
-- Aug 2024
(12, '2024-08-01 10:15:00', 'credit',  38000.00, 'salary',    FALSE, 'online'),
(13, '2024-08-05 12:30:00', 'debit',  22000.00,  'shopping',  FALSE, 'online'),
(14, '2024-08-09 15:45:00', 'credit',  29000.00, 'salary',    FALSE, 'online'),
(15, '2024-08-13 09:00:00', 'debit',  68000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(3,  '2024-08-17 11:15:00', 'credit', 120000.00, 'salary',    FALSE, 'online'),
(4,  '2024-08-21 14:30:00', 'debit',   8900.00,  'utilities', FALSE, 'upi'),
(5,  '2024-08-25 16:45:00', 'debit',  15000.00,  'shopping',  FALSE, 'online'),
-- Sep-Dec 2024 (condensed)
(1,  '2024-09-01 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(6,  '2024-09-05 12:00:00', 'debit',  18000.00,  'shopping',  FALSE, 'online'),
(7,  '2024-09-10 15:00:00', 'credit', 180000.00, 'salary',    FALSE, 'online'),
(8,  '2024-09-15 10:00:00', 'debit',   5500.00,  'utilities', FALSE, 'upi'),
(9,  '2024-09-20 13:00:00', 'debit',  250000.00, 'transfer',  TRUE,  'online'),  -- FRAUD spike
(10, '2024-09-25 16:00:00', 'credit', 220000.00, 'salary',    FALSE, 'online'),
(1,  '2024-10-01 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(2,  '2024-10-08 12:00:00', 'debit',  12000.00,  'shopping',  FALSE, 'atm'),
(3,  '2024-10-15 15:00:00', 'credit', 120000.00, 'salary',    FALSE, 'online'),
(11, '2024-10-22 10:00:00', 'debit',  45000.00,  'transfer',  FALSE, 'online'),
(1,  '2024-11-01 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(4,  '2024-11-08 12:00:00', 'debit',   9200.00,  'utilities', FALSE, 'upi'),
(5,  '2024-11-15 15:00:00', 'credit',  45000.00, 'salary',    FALSE, 'online'),
(12, '2024-11-22 10:00:00', 'debit',  78000.00,  'transfer',  TRUE,  'online'),  -- FRAUD
(1,  '2024-12-01 09:00:00', 'credit',  85000.00, 'salary',    FALSE, 'online'),
(6,  '2024-12-08 12:00:00', 'debit',  25000.00,  'shopping',  FALSE, 'online'),
(7,  '2024-12-15 15:00:00', 'credit', 180000.00, 'salary',    FALSE, 'online'),
(13, '2024-12-22 10:00:00', 'debit',  32000.00,  'transfer',  FALSE, 'online');
