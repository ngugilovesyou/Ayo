import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import ssl
from datetime import datetime


load_dotenv()
year = datetime.now().year
def send_email(to_email, subject, body):
    try:
        
        smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("MAIL_PORT", 465))
        smtp_username = os.getenv("MAIL_USERNAME")
        smtp_password = os.getenv("MAIL_PASSWORD")
        from_email = os.getenv("MAIL_DEFAULT_SENDER", smtp_username)
        
        # Check if using SSL or TLS
        use_tls = os.getenv("MAIL_USE_TLS", "False").lower() == "true"
        use_ssl = os.getenv("MAIL_USE_SSL", "True").lower() == "true"
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        # Send email based on SSL/TLS configuration
        if use_ssl:
            # SSL connection (port 465)
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(smtp_server, smtp_port, context=context)
        else:
            # TLS connection (port 587)
            server = smtplib.SMTP(smtp_server, smtp_port)
            if use_tls:
                server.starttls()
        
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False

def send_order_confirmation_email(order_data):
    is_multi = order_data.get("is_multi_order", False)
    subject = (
        f"Order Confirmed - {order_data['orders'][0]['order_number']}"
        if not is_multi
        else f"Orders Confirmed - {len(order_data['orders'])} orders"
    )

    orders_html = ""
    for block in order_data["orders"]:
        items_html = "".join(
            f"<li>{item['name']} x {item['quantity']} = KES {item['subtotal']:.2f}</li>"
            for item in block["items"]
        )
        orders_html += f"""
        <div class="order-details">
            <p><strong>Order Number:</strong> {block['order_number']}</p>
            <p><strong>Total Amount:</strong> <span class="total">KES {block['total_amount']:.2f}</span></p>
            <p><strong>Payment Method:</strong> {block['payment_method']}</p>
            <p><strong>Payment Status:</strong> {block['payment_status']}</p>
            <h3>Items:</h3>
            <ul>{items_html}</ul>
        </div>
        """

    grand_total_html = (
        f'<p class="total">Grand Total: KES {order_data["grand_total"]:.2f}</p>'
        if is_multi else ""
    )

    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }}
            .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }}
            .total {{ font-size: 18px; font-weight: bold; color: #4CAF50; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>{"Orders" if is_multi else "Order"} Confirmation</h2>
            </div>
            <div class="content">
                <p>Dear <strong>{order_data['first_name']} {order_data['last_name']}</strong>,</p>
                <p>Thank you for your order{"s" if is_multi else ""}! {"They have" if is_multi else "It has"} been confirmed and will be shipped within the next 48 hours.</p>

                {orders_html}
                {grand_total_html}

                <div class="order-details">
                    <p><strong>Delivery Address:</strong> {order_data['delivery_address']}</p>
                    {f"<p><strong>Apartment:</strong> {order_data['apartment']}</p>" if order_data.get('apartment') else ''}
                </div>

                <p>Thank you for shopping with us!</p>
                <p>Best regards,<br><strong>Royal Assets Limited</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
                <p>&copy; {year} Royal Assets Limited. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(order_data["email"], subject, body)




def send_shipping_confirmation_email(order):
    subject = f"Order Shipped - {order.order_number}"
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }}
            .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }}
            .highlight {{ color: #2196F3; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Order Shipped</h2>
            </div>
            <div class="content">
                <p>Dear <strong>{order.first_name} {order.last_name}</strong>,</p>
                <p>Great news! Your order has been shipped and is on its way to you.</p>
                <p>Your package will arrive within the next <span class="highlight">24 hours</span>.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> {order.order_number}</p>
                    <p><strong>M-Pesa Receipt:</strong> {order.mpesa_receipt}</p>
                    <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
                    {f'<p><strong>Apartment:</strong> {order.apartment}</p>' if order.apartment else ''}
                </div>
                
                <p>Thank you for choosing Royal Assets Limited!</p>
                <p>Best regards,<br><strong>Royal Assets Limited</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
                <p>&copy; {year} Royal Assets Limited. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(order.email, subject, body)

def send_order_cancellation_email(order):
    subject = f"Order Cancelled - {order.order_number}"
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }}
            .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ padding: 20px; }}
            .order-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Order Cancelled</h2>
            </div>
            <div class="content">
                <p>Dear <strong>{order.first_name} {order.last_name}</strong>,</p>
                <p>Your order has been cancelled.</p>
                
                <div class="order-details">
                    <p><strong>Order Number:</strong> {order.order_number}</p>
                    <p><strong>Total Amount:</strong> KES {order.total_amount:.2f}</p>
                </div>
                
                <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
                <p>Best regards,<br><strong>Royal Assets Limited</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
                <p>&copy; {year} Royal Assets Limited. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(order.email, subject, body)

def send_low_stock_email(products):
    admin_email = os.getenv("ADMIN_EMAIL")

    if not admin_email:
        print("Admin email not set in environment variables.")
        return False

    subject = f"⚠ Low Stock Alert ({len(products)} Product{'s' if len(products) != 1 else ''})"

    rows = ""

    for product in products:
        rows += f"""
        <tr>
            <td style="padding:10px;border:1px solid #ddd;">#{product.id}</td>
            <td style="padding:10px;border:1px solid #ddd;">{product.name}</td>
            <td style="padding:10px;border:1px solid #ddd;">KES {product.price:,.2f}</td>
            <td style="padding:10px;border:1px solid #ddd;color:#d32f2f;font-weight:bold;">
                {product.quantity}
            </td>
        </tr>
        """

    year = datetime.now().year
    current_time = datetime.now().strftime("%d %b %Y %I:%M %p")

    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>

            body {{
                font-family: Arial, Helvetica, sans-serif;
                background: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 30px;
            }}

            .container {{
                max-width: 700px;
                margin: auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                border:1px solid #ddd;
            }}

            .header {{
                background: #ff9800;
                color: white;
                padding: 25px;
                text-align:center;
            }}

            .content {{
                padding:25px;
            }}

            .alert {{
                background:#fff3cd;
                border-left:5px solid #ff9800;
                padding:15px;
                margin-bottom:20px;
            }}

            table {{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            }}

            th {{
                background:#f7f7f7;
                padding:12px;
                border:1px solid #ddd;
                text-align:left;
            }}

            td {{
                border:1px solid #ddd;
            }}

            .button {{
                display:inline-block;
                margin-top:25px;
                padding:12px 22px;
                background:#ff9800;
                color:white;
                text-decoration:none;
                border-radius:5px;
                font-weight:bold;
            }}

            .footer {{
                text-align:center;
                padding:20px;
                color:#777;
                font-size:13px;
                border-top:1px solid #ddd;
            }}

        </style>
    </head>

    <body>

        <div class="container">

            <div class="header">
                <h2>⚠ Low Stock Alert</h2>
            </div>

            <div class="content">

                <div class="alert">
                    <strong>{len(products)}</strong> product{"s are" if len(products)!=1 else " is"} running low on stock.

                    <br><br>

                    This email was generated automatically at
                    <strong>{current_time}</strong>.
                </div>

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Remaining Stock</th>
                        </tr>

                    </thead>

                    <tbody>

                        {rows}

                    </tbody>

                </table>

                <p style="margin-top:25px;">
                    Please restock these item{"s" if len(products)!=1 else ""} as soon as possible to avoid running out of stock.
                </p>

                <!-- Uncomment when dashboard is live -->

                <!--
                <a class="button"
                   href="https://ayo.co.ke/admin/products">
                   Open Dashboard
                </a>
                -->

            </div>

            <div class="footer">

                This is an automated system notification.<br>

                &copy; {year} Royal Assets Limited. All rights reserved.

            </div>

        </div>

    </body>

    </html>
    """

    return send_email(admin_email, subject, body)