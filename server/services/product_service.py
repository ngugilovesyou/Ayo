from flask import Blueprint, request, jsonify
from config import db, cache
from datetime import datetime
from models import Admin
import pandas as pd
import io
import re
from models import Products, ProductImage, ProductVideo
from flask_jwt_extended import jwt_required, get_jwt_identity
from slugify import slugify

product_bp = Blueprint('product', __name__, url_prefix='/api')


def validate_product_data(data):
    errors = []
    
    if not data.get('name'):
        errors.append("Name is required")
    if not data.get('description'):
        errors.append("Description is required")
    if not data.get('price'):
        errors.append("Price is required")
    else:
        try:
            price = float(data['price'])
            if price < 0:
                errors.append("Price cannot be negative")
        except:
            errors.append("Price must be a valid number")
    
    if data.get('quantity') is not None:
        try:
            quantity = int(data['quantity'])
            if quantity < 0:
                errors.append("Quantity cannot be negative")
        except:
            errors.append("Quantity must be a valid integer")
    
    return errors

def create_product_with_slug(product_data, images=None, videos=None):
    """Helper function to create a product with slug"""
    product = Products(
        name=product_data['name'],
        description=product_data['description'],
        price=product_data['price'],
        quantity=product_data.get('quantity', 0),
        is_active=product_data.get('is_active', True)
    )
    
    # Generate unique slug
    product.slug = product.generate_slug()
    
    db.session.add(product)
    db.session.flush()
    
    # Add images if provided
    if images:
        for idx, image_url in enumerate(images):
            image = ProductImage(
                product_id=product.id,
                image_url=image_url,
                is_primary=(idx == 0),
                display_order=idx
            )
            db.session.add(image)
    
    # Add videos if provided
    if videos:
        for idx, video_url in enumerate(videos):
            video = ProductVideo(
                product_id=product.id,
                video_url=video_url,
                display_order=idx
            )
            db.session.add(video)
    
    return product

def process_bulk_products(df):
    results = {
        'success': [],
        'failed': [],
        'total': len(df),
        'imported': 0,
        'errors': []
    }
    
    for index, row in df.iterrows():
        try:
            product_data = {
                'name': str(row.get('name', '')).strip(),
                'description': str(row.get('description', '')).strip(),
                'price': float(row.get('price', 0)),
                'quantity': int(row.get('quantity', 0)) if pd.notna(row.get('quantity')) else 0,
                'is_active': str(row.get('is_active', 'true')).lower() == 'true'
            }
            
            errors = validate_product_data(product_data)
            
            if errors:
                results['failed'].append({
                    'row': index + 2,
                    'data': product_data,
                    'errors': errors
                })
                results['errors'].extend([f"Row {index + 2}: {', '.join(errors)}"])
                continue
            
            images = []
            videos = []
        
            if pd.notna(row.get('images')):
                images = [url.strip() for url in str(row['images']).split('|') if url.strip()]
            
            if pd.notna(row.get('videos')):
                videos = [url.strip() for url in str(row['videos']).split('|') if url.strip()]
            
            # Use the helper function to create product with slug
            product = create_product_with_slug(product_data, images, videos)
            
            results['success'].append({
                'row': index + 2,
                'name': product_data['name'],
                'slug': product.slug,
                'product_id': product.id
            })
            results['imported'] += 1
            
        except Exception as e:
            results['failed'].append({
                'row': index + 2,
                'data': row.to_dict() if hasattr(row, 'to_dict') else {},
                'errors': [str(e)]
            })
            results['errors'].append(f"Row {index + 2}: {str(e)}")
    
    try:
        db.session.commit()
        cache.clear()
    except Exception as e:
        db.session.rollback()
        results['errors'].append(f"Database error: {str(e)}")
        results['imported'] = 0
    
    return results

@product_bp.route("/products", methods=["POST"])
@jwt_required()
def create_product():
    data = request.get_json()
    admin_id = get_jwt_identity()

    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    
    if not data:
        return jsonify({"error": "Missing JSON payload"}), 400
    
    errors = validate_product_data(data)
    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400
    
    try:
        # Extract images and videos from data
        images = data.get('images', [])
        videos = data.get('videos', [])
        
        # Create product data dict
        product_data = {
            'name': data['name'],
            'description': data['description'],
            'price': float(data['price']),
            'quantity': int(data.get('quantity', 0)),
            'is_active': data.get('is_active', True)
        }
        
        # Process images if they're in the right format
        processed_images = []
        if images:
            for img in images:
                if isinstance(img, str):
                    processed_images.append(img)
                elif isinstance(img, dict) and 'url' in img:
                    processed_images.append(img['url'])
        
        processed_videos = []
        if videos:
            for vid in videos:
                if isinstance(vid, str):
                    processed_videos.append(vid)
                elif isinstance(vid, dict) and 'url' in vid:
                    processed_videos.append(vid['url'])
        
        # Create product with slug
        product = create_product_with_slug(product_data, processed_images, processed_videos)
        
        db.session.commit()
        cache.clear()
        
        return jsonify({
            "message": "Product created successfully",
            "data": product.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while creating product",
            "details": str(e)
        }), 500

@product_bp.route("/products/import/csv", methods=["POST"])
@jwt_required()
def import_products_csv():
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "File must be a CSV"}), 400
    
    try:
        df = pd.read_csv(file)
        results = process_bulk_products(df)
        
        return jsonify({
            "message": f"Import completed. {results['imported']} products imported successfully",
            "results": results
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while importing CSV",
            "details": str(e)
        }), 500

@product_bp.route("/products/import/excel", methods=["POST"])
@jwt_required()
def import_products_excel():
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({"error": "File must be an Excel file (.xlsx or .xls)"}), 400
    
    try:
        df = pd.read_excel(file)
        results = process_bulk_products(df)
        
        return jsonify({
            "message": f"Import completed. {results['imported']} products imported successfully",
            "results": results
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while importing Excel",
            "details": str(e)
        }), 500

@product_bp.route("/products/export/csv", methods=["GET"])
@jwt_required()
def export_products_csv():
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        products = Products.query.filter_by(is_active=True).all()
        
        data = []
        for product in products:
            row = {
                'name': product.name,
                'slug': product.slug,  
                'description': product.description,
                'price': product.price,
                'quantity': product.quantity,
                'is_active': product.is_active,
                'images': '|'.join([img.image_url for img in product.images]),
                'videos': '|'.join([vid.video_url for vid in product.videos])
            }
            data.append(row)
        
        df = pd.DataFrame(data)
        
        output = io.StringIO()
        df.to_csv(output, index=False)
        
        response = jsonify({
            "data": data,
            "total": len(data)
        })
        
        return response, 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while exporting products",
            "details": str(e)
        }), 500

@product_bp.route("/products/export/excel", methods=["GET"])
@jwt_required()
def export_products_excel():
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        products = Products.query.filter_by(is_active=True).all()
        
        data = []
        for product in products:
            row = {
                'name': product.name,
                'slug': product.slug,  
                'description': product.description,
                'price': product.price,
                'quantity': product.quantity,
                'is_active': product.is_active,
                'images': '|'.join([img.image_url for img in product.images]),
                'videos': '|'.join([vid.video_url for vid in product.videos])
            }
            data.append(row)
        
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Products')
        
        output.seek(0)
        
        response = jsonify({
            "data": data,
            "total": len(data)
        })
        
        return response, 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while exporting products",
            "details": str(e)
        }), 500

@product_bp.route("/products", methods=["GET"])
@cache.cached(timeout=300)
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    
    try:
        query = Products.query
        if active_only:
            query = query.filter_by(is_active=True)
        
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            "data": {
                "products": [product.to_dict() for product in products.items],
                "total": products.total,
                "page": products.page,
                "pages": products.pages,
                "per_page": products.per_page,
                "has_next": products.has_next,
                "has_prev": products.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while fetching products",
            "details": str(e)
        }), 500

@product_bp.route("/products/<string:identifier>", methods=["GET"])
@cache.cached(timeout=300)
def get_product(identifier):
    try:
        # Try to find by ID if identifier is numeric
        if identifier.isdigit():
            product = Products.query.get(int(identifier))
        else:
            # Otherwise find by slug
            product = Products.query.filter_by(slug=identifier, is_active=True).first()
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        return jsonify({"data": product.to_dict()}), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while fetching product",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    data = request.get_json()
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    if not data:
        return jsonify({"error": "Missing JSON payload"}), 400
    
    try:
        product = Products.query.get(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        # Update fields
        if 'name' in data:
            product.name = data['name']
            # Regenerate slug when name changes
            product.slug = product.generate_slug()
        
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'quantity' in data:
            product.quantity = int(data['quantity'])
            if product.quantity > 5:
                product.low_stock_notified = False
        if 'is_active' in data:
            product.is_active = data['is_active']
        
        # Update images if provided
        if 'images' in data:
            ProductImage.query.filter_by(product_id=product_id).delete()
            for idx, image_data in enumerate(data['images']):
                if isinstance(image_data, str):
                    image = ProductImage(
                        product_id=product.id,
                        image_url=image_data,
                        is_primary=(idx == 0),
                        display_order=idx
                    )
                else:
                    image = ProductImage(
                        product_id=product.id,
                        image_url=image_data.get('url'),
                        is_primary=image_data.get('is_primary', idx == 0),
                        display_order=image_data.get('display_order', idx)
                    )
                db.session.add(image)
        
        # Update videos if provided
        if 'videos' in data:
            ProductVideo.query.filter_by(product_id=product_id).delete()
            for idx, video_data in enumerate(data['videos']):
                if isinstance(video_data, str):
                    video = ProductVideo(
                        product_id=product.id,
                        video_url=video_data,
                        display_order=idx
                    )
                else:
                    video = ProductVideo(
                        product_id=product.id,
                        video_url=video_data.get('url'),
                        display_order=video_data.get('display_order', idx)
                    )
                db.session.add(video)
        
        db.session.commit()
        cache.clear()
        
        return jsonify({
            "message": "Product updated successfully",
            "data": product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while updating product",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    soft_delete = request.args.get('soft', 'true').lower() == 'true'
    
    try:
        product = Products.query.get(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        if soft_delete:
            product.is_active = False
            message = "Product deactivated successfully"
        else:
            db.session.delete(product)
            message = "Product deleted permanently"
        
        db.session.commit()
        cache.clear()
        
        return jsonify({"message": message}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while deleting product",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>/restore", methods=["POST"])
@jwt_required()
def restore_product(product_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        product = Products.query.get(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        product.is_active = True
        db.session.commit()
        cache.clear()

        return jsonify({
            "message": "Product restored successfully",
            "data": product.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while restoring product",
            "details": str(e)
        }), 500

@product_bp.route("/products/search", methods=["GET"])
def search_products():
    search_term = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    if not search_term:
        return jsonify({"error": "Search term required"}), 400
    
    try:
        query = Products.query.filter(
            (Products.name.ilike(f'%{search_term}%')) |
            (Products.description.ilike(f'%{search_term}%')) |
            (Products.slug.ilike(f'%{search_term}%'))  # Also search by slug
        ).filter_by(is_active=True)
        
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            "data": {
                "products": [product.to_dict() for product in products.items],
                "total": products.total,
                "page": products.page,
                "pages": products.pages,
                "per_page": products.per_page
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while searching products",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>/images", methods=["POST"])
@jwt_required()
def add_product_image(product_id):
    data = request.get_json()
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    if not data or 'url' not in data:
        return jsonify({"error": "Image URL required"}), 400
    
    try:
        product = Products.query.get(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        image = ProductImage(
            product_id=product_id,
            image_url=data['url'],
            is_primary=data.get('is_primary', len(product.images) == 0),
            display_order=data.get('display_order', len(product.images))
        )
        
        db.session.add(image)
        db.session.commit()
        
        return jsonify({
            "message": "Image added successfully",
            "data": image.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while adding image",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>/images/<int:image_id>", methods=["DELETE"])
@jwt_required()
def remove_product_image(product_id, image_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        image = ProductImage.query.filter_by(product_id=product_id, id=image_id).first()
        
        if not image:
            return jsonify({"error": "Image not found"}), 404
        
        db.session.delete(image)
        
        if image.is_primary:
            next_image = ProductImage.query.filter_by(product_id=product_id).first()
            if next_image:
                next_image.is_primary = True
        
        db.session.commit()
        
        return jsonify({"message": "Image removed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while removing image",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>/videos", methods=["POST"])
@jwt_required()
def add_product_video(product_id):
    data = request.get_json()
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401

    if not data or 'url' not in data:
        return jsonify({"error": "Video URL required"}), 400
    
    try:
        product = Products.query.get(product_id)
        
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        video = ProductVideo(
            product_id=product_id,
            video_url=data['url'],
            display_order=data.get('display_order', len(product.videos))
        )
        
        db.session.add(video)
        db.session.commit()
        
        return jsonify({
            "message": "Video added successfully",
            "data": video.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while adding video",
            "details": str(e)
        }), 500

@product_bp.route("/products/<int:product_id>/videos/<int:video_id>", methods=["DELETE"])
@jwt_required()
def remove_product_video(product_id, video_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(admin_id) if admin_id else None

    if not admin:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        video = ProductVideo.query.filter_by(product_id=product_id, id=video_id).first()
        
        if not video:
            return jsonify({"error": "Video not found"}), 404
        
        db.session.delete(video)
        db.session.commit()
        
        return jsonify({"message": "Video removed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "An error occurred while removing video",
            "details": str(e)
        }), 500

@product_bp.route("/products/template/csv", methods=["GET"])
def download_csv_template():
    try:
        template_data = {
            'name': ['Example Product'],
            'slug': ['example-product'],  # Add slug to template
            'description': ['This is a description of the product'],
            'price': [99.99],
            'quantity': [10],
            'is_active': [True],
            'images': ['https://example.com/image1.jpg|https://example.com/image2.jpg'],
            'videos': ['https://youtube.com/watch?v=abc123|https://vimeo.com/456']
        }
        
        df = pd.DataFrame(template_data)
        
        output = io.StringIO()
        df.to_csv(output, index=False)
        
        response = jsonify({
            "template": df.to_dict('records')
        })
        
        return response, 200
        
    except Exception as e:
        return jsonify({
            "error": "An error occurred while generating template",
            "details": str(e)
        }), 500