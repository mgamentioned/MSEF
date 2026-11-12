import app.models  # registers the tables
from app.database import Base, engine

Base.metadata.create_all(engine)
print("Tables created")
