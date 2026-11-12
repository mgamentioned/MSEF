from app.database import Base, engine
import app.models  # registers the tables

Base.metadata.create_all(engine)
print("Tables created")
