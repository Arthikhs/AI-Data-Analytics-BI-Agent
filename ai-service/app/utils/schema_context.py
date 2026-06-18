"""
Schema context for each supported dataset.
Used as context for the LLM to generate accurate SQL.
"""

SCHEMAS = {
    "ecommerce": """
Database: E-Commerce Analytics (PostgreSQL)

Tables:
- categories(category_id, category_name, parent_id, created_at)
- products(product_id, product_name, category_id, price, cost, stock, created_at)
- customers(customer_id, first_name, last_name, email, phone, region, city, segment, acquired_at, created_at)
  segment values: 'Regular', 'Premium', 'VIP'
  region values: 'North', 'South', 'East', 'West'
- orders(order_id, customer_id, order_date, status, total_amount, discount, region, created_at)
  status values: 'completed', 'cancelled', 'pending', 'processing'
- order_items(item_id, order_id, product_id, quantity, unit_price, amount)
  amount = quantity * unit_price (computed column)
- payments(payment_id, order_id, payment_date, amount, method, status)
  method values: 'credit_card', 'upi', 'net_banking', 'wallet'

Key relationships:
- orders.customer_id → customers.customer_id
- order_items.order_id → orders.order_id
- order_items.product_id → products.product_id
- products.category_id → categories.category_id
- payments.order_id → orders.order_id

Notes:
- Revenue = SUM(orders.total_amount) for status='completed'
- Profit = SUM(order_items.quantity * (products.price - products.cost))
- Use order_date for time-based filtering
""",

    "banking": """
Database: Banking Analytics (PostgreSQL)

Tables:
- bank_customers(customer_id, full_name, email, phone, city, kyc_status, created_at)
- branches(branch_id, branch_name, city, region, manager)
- accounts(account_id, customer_id, branch_id, account_type, balance, opened_at, status)
  account_type: 'savings', 'current', 'fd'
- transactions(txn_id, account_id, txn_date, txn_type, amount, category, is_fraud, channel)
  txn_type: 'credit', 'debit'
  channel: 'atm', 'online', 'branch', 'upi'

Key relationships:
- accounts.customer_id → bank_customers.customer_id
- accounts.branch_id → branches.branch_id
- transactions.account_id → accounts.account_id
""",

    "logistics": """
Database: Logistics Analytics (PostgreSQL)

Tables:
- drivers(driver_id, driver_name, phone, region, rating)
- routes(route_id, origin, destination, distance_km, estimated_hrs)
- shipments(shipment_id, order_id, driver_id, route_id, shipped_at, delivered_at, status, shipping_cost)
  status: 'in_transit', 'delivered', 'failed'
- delivery_events(event_id, shipment_id, event_time, event_type, location, notes)
  event_type: 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
- orders(order_id, customer_id, order_date, status, total_amount, region)
"""
}

SYSTEM_PROMPT = """You are an expert SQL query generator for a Business Intelligence platform.

Your task:
1. Understand the user's business question
2. Generate a valid, optimized PostgreSQL SELECT query
3. Only return the SQL — no explanation, no markdown code blocks, no comments

Rules:
- Only SELECT statements
- Always use table aliases for joins
- Use proper GROUP BY with all non-aggregate columns
- Handle NULLs with COALESCE where appropriate
- For time-based queries use TO_CHAR, DATE_TRUNC, or EXTRACT
- Always add ORDER BY for ranking/top-N queries
- Add LIMIT for top-N queries (default 10 if not specified)
- Use meaningful column aliases (snake_case)

{schema_context}

Conversation history:
{history}

User question: {question}

SQL:"""
