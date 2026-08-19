# server/services/contact_service.py

from flask import Blueprint, request, jsonify
from flask_mail import Message
import os
import re
from datetime import datetime
from config import mail

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')

def validate_email(email):
    """Validate email format"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email)

@contact_bp.route('', methods=['POST'])
def send_contact_message():
    try:
        data = request.get_json()
        
       
        required_fields = ['fullName', 'email', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        full_name = data['fullName'].strip()
        email = data['email'].strip()
        message = data['message'].strip()
        
       
        if not validate_email(email):
            return jsonify({
                'success': False,
                'message': 'Invalid email address'
            }), 400
        
        
        if len(message) < 10:
            return jsonify({
                'success': False,
                'message': 'Message must be at least 10 characters'
            }), 400
        
        try:
            msg = Message(
                subject=f'AYO Contact Form: {full_name}',
                sender=email,  
                recipients=['support@ayo.co.ke'],
                body=f"""New contact form submission:

Name: {full_name}
Email: {email}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Message:
{message}

---
This message was sent from the AYO contact form.
Please reply directly to {email} to respond to the customer.
"""
            )
            
            
            mail.send(msg)
            
            # For development, log the message
            print(f"Contact form submission from {full_name} ({email})")
            print(f"Message: {message}")
            
            return jsonify({
                'success': True,
                'message': 'Message sent successfully'
            }), 200
            
        except Exception as email_error:
            print(f"Email sending error: {email_error}")
            return jsonify({
                'success': False,
                'message': 'Failed to send email. Please try again later.'
            }), 500
            
    except Exception as e:
        print(f"Contact form error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred. Please try again.'
        }), 500

@contact_bp.route('/status', methods=['GET'])
def get_contact_status():
    """Optional: Check if contact service is available"""
    return jsonify({
        'status': 'available',
        'message': 'Contact service is running'
    })