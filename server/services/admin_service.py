from flask import jsonify, request
from models import Admin
from config import db, bcrypt
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_csrf_token,
    verify_jwt_in_request
)
from sqlalchemy import func
import time
import re
from flask import Blueprint

admin_bp = Blueprint('admin', __name__, url_prefix='/api')

MAX_FAILED_ATTEMPTS = 5
LOCK_TIME_SECONDS = 900  


def valid_email(email):
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return re.match(pattern, email)


def valid_password(password):
    return len(password) >= 8

@admin_bp.route("/admin/create", methods=["POST"])
def create_admin():
    data = request.get_json()
    email = data.get("email", "")
    password = data.get("password", "")

    email = email.strip().lower()

    if not valid_email(email):
        return jsonify({"error": "Invalid email"}), 400

    if not valid_password(password):
        return jsonify({
            "error": "Password must be at least 8 characters"
        }), 400

    existing_admin = Admin.query.filter(
        func.lower(Admin.email) == email
    ).first()
    

    if existing_admin:
        return jsonify({"error": "Unable to create account"}), 400

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")

    admin = Admin(
        email=email,
        password=hashed,
        failed_attempts=0,
        locked_until=None
    )

    db.session.add(admin)
    db.session.commit()

    return jsonify({
        "message": "Admin created"
    }), 201

@admin_bp.route("/admin/login", methods=["POST"])
def login_admin():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid request format"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Invalid credentials"}), 401
   
    admin = Admin.query.filter(
        func.lower(Admin.email) == email
    ).first()

    # Prevent timing attacks
    time.sleep(1)

    if not admin:
        return jsonify({"error": "Invalid credentials"}), 401

    # Check if account is locked
    if admin.locked_until and admin.locked_until > db.func.now():
        return jsonify({
            "error": "Account temporarily locked"
        }), 403

    if bcrypt.check_password_hash(admin.password, password):
        admin.failed_attempts = 0
        admin.locked_until = None
        db.session.commit()

        token = create_access_token(identity=str(admin.id))
        
        # Get CSRF token
        csrf_token = get_csrf_token(token)

        response = jsonify({
            "success": True,
            "admin": {
                "email": admin.email,
                "id": admin.id
            },
            "csrf_token": csrf_token  
        })

        set_access_cookies(response, token)
        return response, 200

    # Failed login attempt
    admin.failed_attempts += 1

    if admin.failed_attempts >= MAX_FAILED_ATTEMPTS:
        from datetime import datetime, timedelta
        admin.locked_until = datetime.utcnow() + timedelta(
            seconds=LOCK_TIME_SECONDS
        )
        admin.failed_attempts = 0

    db.session.commit()
    return jsonify({"error": "Invalid credentials"}), 401


@admin_bp.route("/admin/logout", methods=["POST"])
def logout_admin():
    response = jsonify({"success": True, "message": "Logged out successfully"})
    unset_jwt_cookies(response)
    return response, 200

@admin_bp.route("/admin/verify", methods=["GET"])
@jwt_required(locations=["cookies"])
def verify_admin_token():
    admin_id = get_jwt_identity()
    if not admin_id:
        return jsonify({"error": "Admin not found"}), 404

    admin = db.session.get(Admin, admin_id)

    if admin:
        return jsonify({
            "success": True,
            "admin": {
                "email": admin.email,
                "id": admin.id
            }
        }), 200

    return jsonify({"error": "Admin not found"}), 404

@admin_bp.route("/admin/debug", methods=["GET"])
def debug():
    """Debug endpoint to check authentication status"""
    try:
        verify_jwt_in_request()
        admin_id = get_jwt_identity()
        return jsonify({
            "authenticated": True,
            "admin_id": admin_id,
            "cookies": dict(request.cookies),
            "headers": {
                "x-csrf-token": request.headers.get("X-CSRF-TOKEN"),
                "cookie": request.headers.get("Cookie", "")
            }
        })
    except Exception as e:
        return jsonify({
            "authenticated": False,
            "error": str(e),
            "cookies": dict(request.cookies)
        })