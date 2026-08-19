import base64
from datetime import datetime
import requests
import os
from dotenv import load_dotenv

load_dotenv()

consumer_key = os.getenv("MPESA_CONSUMER_KEY")
consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")

def fetch_access_token():
    if not consumer_key or not consumer_secret:
        return None, {"error": "MPESA credentials not set"}
    
    url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    try:
        response = requests.get(url, auth=(consumer_key, consumer_secret))
        
        if response.status_code == 200:
            return response.json().get("access_token"), None
        else:
            return None, {"error": f"Failed to fetch token: {response.status_code}", "details": response.text}
    except Exception as e:
        return None, {"error": "An error occurred", "details": str(e)}

def initiate_stk_push(phone_number, amount, order_id, order_number):
    access_token, error = fetch_access_token()
    
    if error:
        return False, error
    
    stk_push_url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    passkey = os.getenv("MPESA_PASSKEY")
    shortcode = os.getenv("MPESA_SHORTCODE")
    callback_url = os.getenv("MPESA_CALLBACK_URL")
    partyB = "5624264"
    
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    
    phone = phone_number
    if not phone.startswith("254"):
        phone = "254" + phone.lstrip("0")
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerBuyGoodsOnline",
        "Amount": str(int(amount)),
        "PartyA": phone,
        "PartyB": "5624264",
        "PhoneNumber": phone,
        "CallBackURL": f"https://991c-217-199-144-42.ngrok-free.app/api/mpesa/callback?order_id={order_id}",
        "AccountReference": order_number,
        "TransactionDesc": f"Payment for order {order_number}"
    }
    
    try:
        response = requests.post(stk_push_url, json=payload, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ResponseCode') == '0':
                return True, {
                    "checkout_request_id": result.get('CheckoutRequestID'),
                    "merchant_request_id": result.get('MerchantRequestID'),
                    "response_description": result.get('ResponseDescription')
                }
            else:
                return False, {"error": "STK Push failed", "details": result}
        else:
            return False, {"error": "Failed to initiate STK Push", "details": response.text}
    except Exception as e:
        return False, {"error": "An error occurred", "details": str(e)}