from config import db
from datetime import datetime
from sqlalchemy.orm import validates
from sqlalchemy import Numeric
from slugify import slugify

class Products(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(Numeric(10,2), nullable=False)
    quantity = db.Column(db.Integer, default=0, index=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    low_stock_notified = db.Column(db.Boolean,default=False, index=True)

    # Relationships
    images = db.relationship("ProductImage", back_populates="product", lazy="selectin", cascade="all, delete-orphan")
    videos = db.relationship("ProductVideo", back_populates="product", lazy="selectin", cascade="all, delete-orphan")
    order_items = db.relationship("OrderItems", back_populates="product", lazy=True)

    def generate_slug(self):
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        
        
        while Products.query.filter(Products.slug == slug, Products.id != self.id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
     
    @validates('price')
    def validate_price(self, key, price):
        if price < 0:
            raise ValueError("Price cannot be negative")
        return price

    @validates('quantity')
    def validate_quantity(self, key, quantity):
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        return quantity

    def to_dict(self, include_media=True):
        data = {
            'id': self.id,
            'name': self.name,
            'slug':self.slug,
            'description': self.description,
            'price': self.price,
            'quantity': self.quantity,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_media:
            data['images'] = [img.to_dict() for img in self.images]
            data['videos'] = [vid.to_dict() for vid in self.videos]
            
        return data

class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Products", back_populates="images")

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.image_url,
            'is_primary': self.is_primary,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ProductVideo(db.Model):
    __tablename__ = "product_videos"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    video_url = db.Column(db.String(500), nullable=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Products", back_populates="videos")

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.video_url,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }