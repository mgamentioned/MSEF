import sys

from app.database import SessionLocal
from app.models import User

email = sys.argv[1].strip().lower()

db = SessionLocal()
existing = db.query(User).filter(User.email == email).first()

if existing:
    print(f"{email} already exists as {existing.role}")
else:
    db.add(User(email=email, role="admin"))
    db.commit()
    print(f"Admin created: {email}")

db.close()
