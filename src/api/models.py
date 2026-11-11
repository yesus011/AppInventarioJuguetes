from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, func

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(Integer, primary_key=True)
    email = db.Column(String(120), unique=True, nullable=False)
    password = db.Column(String(255), nullable=False)
    is_active = db.Column(Boolean, nullable=False, default=False)
    role = db.Column(String(20), nullable=False, default="inventory_editor")
    status = db.Column(String(20), nullable=False, default="pending")
    auth_version = db.Column(Integer, nullable=False, default=0)
    password_reset_requested = db.Column(Boolean, nullable=False, default=False)


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "password_reset_requested": self.password_reset_requested,
        }


class InventoryItem(db.Model):
    __table_args__ = (CheckConstraint("quantity >= 0", name="ck_inventory_item_quantity_nonnegative"),)

    id = db.Column(Integer, primary_key=True)
    description = db.Column(String(200), nullable=False)
    quantity = db.Column(Integer, nullable=False, default=0)
    image_url = db.Column(String(1000), nullable=True)
    condition = db.Column(String(30), nullable=False)
    brand = db.Column(String(100), nullable=True)
    age = db.Column(String(50), nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "description": self.description,
            "quantity": self.quantity,
            "image_url": self.image_url,
            "condition": self.condition,
            "brand": self.brand,
            "age": self.age,
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
    observations = db.Column(db.Text, nullable=True)
    item = db.relationship("InventoryItem")
    creator = db.relationship("User")

    def serialize(self):
        return {
            "id": self.id,
            "item_id": self.item_id,
            "item_description": self.item.description,
            "item_brand": self.item.brand,
            "item_age": self.item.age,
            "destination": self.destination,
            "exit_date": self.exit_date.isoformat(),
            "quantity": self.quantity,
            "observations": self.observations,
            "created_by": self.creator.email,
        }