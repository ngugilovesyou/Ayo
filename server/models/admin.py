from config import db
class Admin(db.Model):
    __tablename__ = "admins"
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True, unique=True)
    password=db.Column(db.String(120), nullable=False)
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Admin {self.email}>"