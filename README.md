# MSEF Website

Back end: FastAPI + PostgreSQL. Front end: React (Vite) in `frontend/`.

## Back end
1. `python -m venv venv` then `venv\Scripts\activate`
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in the password and a secret
   (`python -c "import secrets; print(secrets.token_hex(32))"`)
4. `python create_tables.py` (first time only)
5. `python create_admin.py someone@example.com` (first time only)
6. `uvicorn app.main:app --reload` then open http://127.0.0.1:8000/docs

## Front end
1. `cd frontend`, `npm install`, `npm run dev`
2. Open http://localhost:5173
