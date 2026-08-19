from config import db
from datetime import datetime
import secrets

class Orders(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)
    apartment = db.Column(db.String(255), nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default="Mpesa")
    payment_status = db.Column(db.String(30), default="Pending", index=True)
    order_status = db.Column(db.String(30), default="Pending", index=True)
    mpesa_receipt = db.Column(db.String(100), unique=True, nullable=False)
    order_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    shipped_at = db.Column(db.DateTime, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship("OrderItems", back_populates="order", cascade="all, delete-orphan", lazy=True)
    audits = db.relationship("OrderAudit", back_populates="order", cascade="all, delete-orphan", lazy=True)

    @staticmethod
    def generate_order_number():
        return f"AYO-{secrets.token_hex(3).upper()}"

    @staticmethod
    def generate_mpesa_receipt():
        return f"MPESA-{secrets.token_hex(4).upper()}"

    def to_dict(self, include_items=True):
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone_number': self.phone_number,
            'delivery_address': self.delivery_address,
            'apartment': self.apartment,
            'total_amount': self.total_amount,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'order_status': self.order_status,
            'mpesa_receipt': self.mpesa_receipt,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        
        return data