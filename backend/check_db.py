from app.services.db import db
orders = list(db.orders.find())
print(f"Total orders: {len(orders)}")
for o in orders:
    print(f"ID: {o.get('_id')} | Status: {o.get('status')} | Story: {o.get('story') is not None} | Title: {o.get('title')}")
