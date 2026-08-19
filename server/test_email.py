from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

app.config.update(
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_USE_TLS=os.getenv("MAIL_USE_TLS", "True") == "True",
    MAIL_USE_SSL=os.getenv("MAIL_USE_SSL", "False") == "True",
    MAIL_DEFAULT_SENDER=os.getenv("MAIL_DEFAULT_SENDER"),
)

mail = Mail(app)

with app.app_context():
    msg = Message(
        subject="Flask-Mail Test",
        recipients=[os.getenv("TEST_EMAIL_RECIPIENT")],
        body="Congratulations! Your Flask-Mail configuration is working."
    )

    try:
        mail.send(msg)
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")