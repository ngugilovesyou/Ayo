from config import db, cache
from models import Orders, OrderItems, OrderAudit, Products
from services.email_service import send_low_stock_email, send_order_confirmation_email, send_shipping_confirmation_email, send_order_cancellation_email
from services.mpesa_payment import initiate_stk_push
from datetime import datetime, timedelta
from sqlalchemy import and_
import threading
from flask import Blueprint, request, jsonify, current_app

order_bp = Blueprint('orders', __name__, url_prefix='/api')

def build_order_email_data(orders):
    """
    Accepts a single Orders object or a list of Orders objects.
    Returns a normalized dict that send_order_confirmation_email can render,
    whether it's one order or several bundled into one email.
    """
    if not isinstance(orders, (list, tuple)):
        orders = [orders]

    order_blocks = []
    grand_total = 0

    for order in orders:
        items = [
            {
                "name": item.product.name if item.product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ]
        order_blocks.append({
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "items": items,
        })
        grand_total += order.total_amount

    first = orders[0]
    return {
        "first_name": first.first_name,
        "last_name": first.last_name,
        "email": first.email,
        "delivery_address": first.delivery_address,
        "apartment": first.apartment,
        "orders": order_blocks,
        "grand_total": grand_total,
        "is_multi_order": len(order_blocks) > 1,
    }

def cleanup_shipped_orders():
    def cleanup():
        with db.app.app_context():
            cutoff_time = datetime.utcnow() - timedelta(hours=36)
            shipped_orders = Orders.query.filter(
                and_(
                    Orders.order_status == 'Shipped',
                    Orders.shipped_at <= cutoff_time
                )
            ).all()
            
            for order in shipped_orders:
                try:
                    order.order_status = 'Archived'
                    order.delivery_address = None
                    order.apartment = None
                    order.phone_number = None
                    order.total_amount = 0
                    order.payment_method = None
                    order.payment_status = None
                    
                    for item in order.items:
                        db.session.delete(item)
                    
                    audit = OrderAudit(
                        order_id=order.id,
                        action='ARCHIVED',
                        details='Order archived after 36 hours of shipping'
                    )
                    db.session.add(audit)
                    db.session.commit()
                except Exception as e:
                    db.session.rollback()
                    print(f"Error cleaning up order {order.id}: {str(e)}")
    
    thread = threading.Thread(target=cleanup)
    thread.daemon = True
    thread.start()

def check_low_stock(product):
    LOW_STOCK_LIMIT = 5

    if product.quantity > LOW_STOCK_LIMIT:
        return

    if product.low_stock_notified:
        return

    low_stock_products = Products.query.filter(
        Products.quantity <= LOW_STOCK_LIMIT,
        Products.low_stock_notified == False
    ).all()

    if not low_stock_products:
        return

    executor = current_app.executor
    executor.submit(send_low_stock_email, low_stock_products)

    for item in low_stock_products:
        item.low_stock_notified = True

    db.session.commit()

@order_bp.route("/orders", methods=["POST"])
def create_order():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON payload"}), 400
    
    required_fields = ['first_name', 'last_name', 'email', 'phone_number', 'delivery_address', 'items']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    if not data['items'] or len(data['items']) == 0:
        return jsonify({"error": "Order must have at least one item"}), 400
    
    try:
        total_amount = 0
        for item_data in data['items']:
            if 'product_id' not in item_data or 'quantity' not in item_data:
                return jsonify({"error": "Each item must have product_id and quantity"}), 400
            
            product = Products.query.get(item_data['product_id'])
            if not product:
                return jsonify({"error": f"Product {item_data['product_id']} not found"}), 404
            
            if product.quantity < item_data['quantity']:
                return jsonify({"error": f"Insufficient quantity for product {product.name}"}), 400
            
            total_amount += product.price * item_data['quantity']
        
        order = Orders(
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data['email'],
            phone_number=data['phone_number'],
            delivery_address=data['delivery_address'],
            apartment=data.get('apartment'),
            total_amount=total_amount,
            payment_method=data.get('payment_method', 'Mpesa'),
            payment_status='Pending',
            order_status='Pending',
            mpesa_receipt=Orders.generate_mpesa_receipt(),
            order_number=Orders.generate_order_number()
        )
        
        db.session.add(order)
        db.session.flush()
        
        for item_data in data['items']:
            product = Products.query.get(item_data['product_id'])
            subtotal = product.price * item_data['quantity']
            
            order_item = OrderItems(
                order_id=order.id,
                product_id=item_data['product_id'],
                quantity=item_data['quantity'],
                unit_price=product.price,
                subtotal=subtotal
            )
            db.session.add(order_item)
            product.quantity -= item_data['quantity']
            check_low_stock(product)
        
        audit = OrderAudit(
            order_id=order.id,
            action='CREATED',
            details=f'Order created with {len(data["items"])} items'
        )
        db.session.add(audit)
        db.session.commit()
        
        if data.get('payment_method', 'Mpesa') == 'Mpesa':
            success, result = initiate_stk_push(
                data['phone_number'],
                total_amount,
                order.id,
                order.order_number
            )
            
            if success:
                return jsonify({
                    "success": True,
                    "message": "Order created and STK push initiated",
                    "data": order.to_dict(),
                    "payment": result
                }), 201
            else:
                order.payment_status = 'Failed'
                order.order_status = 'Cancelled'
                for item in order.items:
                    product = Products.query.get(item.product_id)
                    if product:
                        product.quantity += item.quantity
                        
                db.session.commit()
                return jsonify({
                    "success": False,
                    "error": "Payment initiation failed",
                    "details": result,
                    "order": order.to_dict()
                }), 400
        
        return jsonify({
            "success": True,
            "message": "Order created successfully",
            "data": order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders", methods=["GET"])
def get_orders():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    payment_status = request.args.get('payment_status')
    
    try:
        query = Orders.query
        
        if status:
            query = query.filter_by(order_status=status)
        if payment_status:
            query = query.filter_by(payment_status=payment_status)
        
        orders = query.order_by(Orders.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            "success": True,
            "data": {
                "orders": [order.to_dict() for order in orders.items],
                "total": orders.total,
                "page": orders.page,
                "pages": orders.pages,
                "per_page": orders.per_page,
                "has_next": orders.has_next,
                "has_prev": orders.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/<int:order_id>", methods=["GET"])
def get_order_by_id(order_id):
    try:
        order = Orders.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        return jsonify({"success": True, "data": order.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/number/<string:order_number>", methods=["GET"])
def get_order_by_number(order_number):
    try:
        order = Orders.query.filter_by(order_number=order_number).first()
        if not order:
            return jsonify({"error": "Order not found"}), 404
        return jsonify({"success": True, "data": order.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    data = request.get_json()
    if not data or 'order_status' not in data:
        return jsonify({"error": "Missing order_status field"}), 400
    
    new_status = data['order_status']
    valid_statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Archived']
    
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    try:
        order = Orders.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        old_status = order.order_status
        order.order_status = new_status
        
        if new_status == 'Shipped':
            order.shipped_at = datetime.utcnow()
            audit = OrderAudit(
                order_id=order.id,
                action='SHIPPED',
                details=f'Order shipped from {old_status}'
            )
            db.session.add(audit)
            db.session.commit()
            
            # Use executor for email
            executor = current_app.executor
            executor.submit(send_shipping_confirmation_email, order)
            cleanup_shipped_orders()
            
        elif new_status == 'Cancelled':
            audit = OrderAudit(
                order_id=order.id,
                action='CANCELLED',
                details=f'Order cancelled from {old_status}'
            )
            db.session.add(audit)
            
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
            
            db.session.commit()
            
            # Use executor for email
            executor = current_app.executor
            executor.submit(send_order_cancellation_email, order)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Order status updated to {new_status}",
            "data": order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/<int:order_id>/payment", methods=["PUT"])
def update_payment_status(order_id):
    data = request.get_json()
    if not data or 'payment_status' not in data:
        return jsonify({"error": "Missing payment_status field"}), 400
    
    new_status = data['payment_status']
    valid_statuses = ['Pending', 'Paid', 'Failed']
    
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
    
    try:
        order = Orders.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        old_status = order.payment_status
        order.payment_status = new_status
        
        if new_status == 'Paid':
            order.order_status = 'Processing'
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_CONFIRMED',
                details=f'Payment status updated from {old_status} to {new_status}'
            )
            db.session.add(audit)
            db.session.commit()
            
            # Use executor for email
            executor = current_app.executor

            email_data = build_order_email_data(order)  # do this before commit/session teardown risk
            executor.submit(send_order_confirmation_email, email_data)
        else:
            db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Payment status updated to {new_status}",
            "data": order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/<int:order_id>/cancel", methods=["POST"])
def cancel_order(order_id):
    try:
        order = Orders.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        if order.order_status in ['Shipped', 'Delivered']:
            return jsonify({"error": "Cannot cancel order that has been shipped or delivered"}), 400
        
        order.order_status = 'Cancelled'
        
        for item in order.items:
            product = Products.query.get(item.product_id)
            if product:
                product.quantity += item.quantity
        
        audit = OrderAudit(
            order_id=order.id,
            action='CANCELLED',
            details='Order cancelled by user request'
        )
        db.session.add(audit)
        db.session.commit()
        
        # Use executor for email
        executor = current_app.executor
        executor.submit(send_order_cancellation_email, order)
        
        return jsonify({
            "success": True,
            "message": "Order cancelled successfully",
            "data": order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/<int:order_id>/audit", methods=["GET"])
def get_order_audit(order_id):
    try:
        order = Orders.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        audits = OrderAudit.query.filter_by(order_id=order_id).order_by(OrderAudit.created_at.desc()).all()
        
        return jsonify({
            "success": True,
            "data": {
                "order_id": order_id,
                "order_number": order.order_number,
                "audit_trail": [audit.to_dict() for audit in audits]
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@order_bp.route("/orders/stats", methods=["GET"])
@cache.cached(timeout=60)
def get_order_stats():
    try:
        total_orders = Orders.query.count()
        pending_orders = Orders.query.filter_by(order_status='Pending').count()
        processing_orders = Orders.query.filter_by(order_status='Processing').count()
        shipped_orders = Orders.query.filter_by(order_status='Shipped').count()
        delivered_orders = Orders.query.filter_by(order_status='Delivered').count()
        cancelled_orders = Orders.query.filter_by(order_status='Cancelled').count()
        
        paid_orders = Orders.query.filter_by(payment_status='Paid').count()
        pending_payment = Orders.query.filter_by(payment_status='Pending').count()
        failed_payment = Orders.query.filter_by(payment_status='Failed').count()
        
        total_revenue = db.session.query(db.func.sum(Orders.total_amount)).filter_by(payment_status='Paid').scalar() or 0
        
        return jsonify({
            "success": True,
            "data": {
                "orders": {
                    "total": total_orders,
                    "pending": pending_orders,
                    "processing": processing_orders,
                    "shipped": shipped_orders,
                    "delivered": delivered_orders,
                    "cancelled": cancelled_orders
                },
                "payments": {
                    "paid": paid_orders,
                    "pending": pending_payment,
                    "failed": failed_payment
                },
                "revenue": {
                    "total": total_revenue
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@order_bp.route("/mpesa/callback", methods=["POST"])
def process_mpesa_callback():
    print("=" * 50)
    print("MPESA CALLBACK RECEIVED")
    print(f"Time: {datetime.utcnow()}")
    print(f"Order ID from args: {request.args.get('order_id')}")
    print("=" * 50)
    
    data = request.get_json()
    order_id = request.args.get('order_id')
    
    if not order_id:
        print("ERROR: Order ID missing")
        return jsonify({"error": "Order ID missing"}), 400
    
    try:
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        
        print(f"Result Code: {result_code}")
        print(f"Result Description: {result_desc}")
        print(f"Checkout Request ID: {checkout_request_id}")
        
        order = Orders.query.get(int(order_id))
        if not order:
            print(f"ERROR: Order {order_id} not found")
            return jsonify({"error": "Order not found"}), 404
        
        print(f"Order found: {order.order_number}, Current status: {order.payment_status}")
        
        
        if result_code == 0:
            print("✅ Payment successful")
            
            # Extract receipt number
            mpesa_receipt_number = checkout_request_id
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    mpesa_receipt_number = item.get('Value')
                    print(f"Found Receipt Number: {mpesa_receipt_number}")
            
            # Update order
            order.payment_status = 'Paid'
            order.mpesa_receipt = mpesa_receipt_number
            order.order_status = 'Processing'
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_CONFIRMED',
                details=f'Payment confirmed with receipt {mpesa_receipt_number}'
            )
            db.session.add(audit)
            db.session.commit()
            
            print(f"✅ Order {order.order_number} updated to PAID")
            
            # Send confirmation email
            try:
                executor = current_app.executor
                email_data = build_order_email_data(order)  # do this before commit/session teardown risk
                executor.submit(send_order_confirmation_email, email_data)
                print("📧 Confirmation email scheduled")
            except Exception as e:
                print(f"❌ Email scheduling error: {str(e)}")
            
            return jsonify({
                "success": True, 
                "message": "Payment confirmed",
                "order_status": order.payment_status
            }), 200
        
       
        elif result_code == 1032:
            print("❌ User cancelled the payment")
            
            # Update order status
            order.payment_status = 'Cancelled'
            order.order_status = 'Cancelled'
            
            # Restore product quantities
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
                    print(f"Restored {item.quantity} of product {product.name}")
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_CANCELLED',
                details=f'Payment cancelled by user: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            print(f"❌ Order {order.order_number} cancelled by user")
            
            # Send cancellation email
            try:
                executor = current_app.executor
                executor.submit(send_order_cancellation_email, order)
                print("📧 Cancellation email scheduled")
            except Exception as e:
                print(f"❌ Email scheduling error: {str(e)}")
            
            return jsonify({
                "success": False,
                "message": "Payment cancelled by user",
                "result_code": result_code
            }), 200
        
       
        elif result_code in [2001, 8]:
            print("⏰ Payment timed out - User can retry")
            
            # Keep order as Pending - user can retry
            order.payment_status = 'Pending'
            order.order_status = 'Pending'
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_TIMEOUT',
                details=f'Payment timed out: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            print(f"⏰ Order {order.order_number} still pending, user can retry")
            
            return jsonify({
                "success": False,
                "message": "Payment timed out. Please try again.",
                "result_code": result_code,
                "can_retry": True
            }), 200
        
       
        elif result_code == 1:
            print("💰 Insufficient funds")
            
            order.payment_status = 'Failed'
            order.order_status = 'Failed'
            
            # Restore product quantities
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
                    print(f"Restored {item.quantity} of product {product.name}")
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_FAILED',
                details=f'Insufficient funds: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            print(f"❌ Order {order.order_number} failed - insufficient funds")
            
            return jsonify({
                "success": False,
                "message": "Insufficient funds. Please top up your M-Pesa and try again.",
                "result_code": result_code
            }), 200
        
        elif result_code == 2:
            print("❌ Amount below minimum")
            
            order.payment_status = 'Failed'
            order.order_status = 'Failed'
            
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_FAILED',
                details=f'Amount below minimum: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            return jsonify({
                "success": False,
                "message": "Amount below minimum transaction limit.",
                "result_code": result_code
            }), 200
        
        
        elif result_code == 3:
            print("❌ Amount exceeds maximum")
            
            order.payment_status = 'Failed'
            order.order_status = 'Failed'
            
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_FAILED',
                details=f'Amount exceeds maximum: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            return jsonify({
                "success": False,
                "message": "Amount exceeds maximum transaction limit.",
                "result_code": result_code
            }), 200
        
        
        elif result_code == 7:
            print("❌ Invalid PIN entered")
            
            order.payment_status = 'Failed'
            order.order_status = 'Failed'
            
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_FAILED',
                details=f'Invalid PIN: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            return jsonify({
                "success": False,
                "message": "Invalid M-Pesa PIN. Please try again.",
                "result_code": result_code
            }), 200
        
        
        elif result_code == 9:
            print("⚠️ System error - Retry later")
            
            
            order.payment_status = 'Pending'
            order.order_status = 'Pending'
            
            audit = OrderAudit(
                order_id=order.id,
                action='SYSTEM_ERROR',
                details=f'System error: {result_desc}'
            )
            db.session.add(audit)
            db.session.commit()
            
            return jsonify({
                "success": False,
                "message": "System error. Please try again later.",
                "result_code": result_code,
                "can_retry": True
            }), 200
        
        else:
            print(f"❌ Payment failed with code {result_code}: {result_desc}")
            
            order.payment_status = 'Failed'
            order.order_status = 'Cancelled'
            
            for item in order.items:
                product = Products.query.get(item.product_id)
                if product:
                    product.quantity += item.quantity
            
            audit = OrderAudit(
                order_id=order.id,
                action='PAYMENT_FAILED',
                details=f'Payment failed: {result_desc} (Code: {result_code})'
            )
            db.session.add(audit)
            db.session.commit()
            
            return jsonify({
                "success": False,
                "message": f"Payment failed: {result_desc}",
                "result_code": result_code
            }), 200
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ Callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500