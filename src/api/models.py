from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, func

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(Integer, primary_key=True)
    email = db.Column(String(120), unique=True, nullable=False)
    password = db.Column(String(255), nullable=False)
    is_active = db.Column(Boolean, nullable=False, default=False)
    role = db.Column(String(20), nullable=False, default="user")
    status = db.Column(String(20), nullable=False, default="pending")


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "status": self.status,
        }


class InventoryItem(db.Model):
    __table_args__ = (CheckConstraint("quantity >= 0", name="ck_inventory_item_quantity_nonnegative"),)

    id = db.Column(Integer, primary_key=True)
    description = db.Column(String(200), nullable=False)
    quantity = db.Column(Integer, nullable=False, default=0)
    image_url = db.Column(String(1000), nullable=True)
    condition = db.Column(String(30), nullable=False)

    def serialize(self):
        return {
            "id": self.id,
            "description": self.description,
            "quantity": self.quantity,
            "image_url": self.image_url,
            "condition": self.condition,
        }


class InventoryExit(db.Model):
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_inventory_exit_quantity_positive"),)

    id = db.Column(Integer, primary_key=True)
    item_id = db.Column(Integer, ForeignKey("inventory_item.id"), nullable=False)
    destination = db.Column(String(200), nullable=False)
    exit_date = db.Column(Date, nullable=False)
    quantity = db.Column(Integer, nullable=False)
    created_by = db.Column(Integer, ForeignKey("user.id"), nullable=False)
    created_at = db.Column(DateTime, nullable=False, server_default=func.now())
    item = db.relationship("InventoryItem")
    creator = db.relationship("User")

    def serialize(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_description": self.item.description,
            "destination": self.destination,
            "exit_date": self.exit_date.isoformat(),
            "quantity": self.quantity,
            "created_by": self.creator.email,
        }