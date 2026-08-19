# Ayo

Ayo is a lightweight e‑commerce platform composed of a Vite + React frontend and a Flask backend. It provides product management, order processing (including M‑Pesa payment integration), admin utilities, and email notifications. The project is designed for rapid development and small-to-medium storefronts.

- Frontend: React (Vite), Tailwind CSS, TanStack Query
- Backend: Flask 3, SQLAlchemy, Flask-Migrate (Alembic), JWT (cookie-based), caching

---

## Key features

- Product catalog with images and videos
- Import/export products (CSV / Excel)
- Search, pagination and product detail endpoints
- Admin-only protected CRUD for products
- Order processing with M-Pesa integration
- Email notifications for orders (order confirmation, shipping, cancellations)
- Sitemap generation endpoint for SEO
- SQLite by default, supports migrations via Flask-Migrate

---

## Repository layout

```
client/                  # React + Vite frontend
  package.json           # frontend dependencies & scripts
  src/                   # React app source (main.jsx -> App.jsx)
server/                  # Flask backend
  app.py                 # app bootstrap, blueprint registration, sitemap
  config.py              # Flask config (DB, JWT, CORS, Cache, Mail)
  requirements.txt       # Python dependencies
  models/                # SQLAlchemy models (Products, ProductImage, ProductVideo, Orders, ...)
  services/              # Blueprint implementations and helpers
    product_service.py
    order_service.py
    mpesa_payment.py
    email_service.py
    admin_service.py
    contact_service.py
LICENSE
.gitignore
```

---

## Quickstart — Development

These are the minimal steps to get both frontend and backend running locally.

1) Backend (Python / Flask)

```bash
# create & activate venv
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
# .venv\Scripts\Activate.ps1

# install requirements
pip install -r server/requirements.txt

# basic run (development)
python server/app.py
```

- The Flask app uses `sqlite:///ayo.db` by default (see `server/config.py`).
- The dev server is started by `app.run(debug=True)` in `server/app.py` and listens on port 5000 by default.

Database migrations (Flask-Migrate / Alembic)

```bash
export FLASK_APP=server.app        # or set FLASK_APP on Windows
flask db init
flask db migrate -m "Initial"
flask db upgrade
```

2) Frontend (Node / Vite)

```bash
cd client
npm install
npm run dev
```

- Vite runs on port 5173 by default. The backend CORS config already allows `http://localhost:5173` and `http://127.0.0.1:5173`.

---

## Environment variables

Important env vars used by the backend (defaults are in `server/config.py` — adjust for production):

- JWT_SECRET_KEY — secret for Flask-JWT-Extended (default fallback used in config; replace in production)
- MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER — for outgoing emails
- Any DB connection override if you prefer Postgres / MySQL (change `SQLALCHEMY_DATABASE_URI`)

Security notes:
- JWTs are stored in cookies and CSRF protection is enabled. Set `JWT_COOKIE_SECURE = True` in production (HTTPS) and configure `JWT_COOKIE_DOMAIN` / `JWT_COOKIE_SAMESITE` appropriately.

---

## API overview (selected endpoints)

Base path: `/api`

- GET /api/hello
  - Simple health/test endpoint returning `{ "message": "Hello, World!" }`

Products
- GET /api/products
  - Query params: `page`, `per_page`, `active_only` (defaults: 1, 20, true)
  - Returns paginated products
- GET /api/products/<identifier>
  - identifier can be numeric id or slug
- POST /api/products
  - Admin-only (JWT cookie). Create product (supports images/videos)
- PUT /api/products/<product_id>
  - Admin-only. Update product and its media
- DELETE /api/products/<product_id>
  - Admin-only. Soft delete by default (`?soft=true`)
- POST /api/products/<product_id>/restore
  - Admin-only. Restore a soft-deleted product
- GET /api/products/search?q=<term>
  - Full-text-ish search (name, description, slug)
- CSV/Excel import & export:
  - POST /api/products/import/csv (file form-data; admin only)
  - POST /api/products/import/excel
  - GET /api/products/export/csv
  - GET /api/products/export/excel
  - GET /api/products/template/csv — returns a template payload for imports
- Media endpoints:
  - POST /api/products/<id>/images
  - DELETE /api/products/<id>/images/<image_id>
  - POST /api/products/<id>/videos
  - DELETE /api/products/<id>/videos/<video_id>

Orders & payments
- Server contains an order blueprint with comprehensive order flows.
- M-Pesa: `server/services/mpesa_payment.py` exposes STK push functionality for payments (refer to the file for setup and usage).
- Email notifications for order events are implemented in `server/services/email_service.py`:
  - send_order_confirmation_email
  - send_shipping_confirmation_email
  - send_order_cancellation_email

Sitemap
- GET /sitemap.xml — dynamically generates sitemap including static pages and active product pages (base URL currently set to `https://ayo.co.ke` in `server/app.py` — change for your deployment).

---

## Notes on implementation & conventions

- Product slugs are generated and guaranteed unique by the model (`Products.generate_slug()`).
- Models use SQLAlchemy; `Products.to_dict()` returns structured product payload including media.
- Server uses `Flask-Caching` (`SimpleCache` by default). Several GET endpoints are cached (e.g., product listings).
- Admin-only endpoints are protected via JWT identity in cookies — ensure you implement admin auth flows before calling admin endpoints.

---

## Running tests

No test suite is provided in the current repository. To add tests, consider using pytest in `server/tests` and `client/__tests__` with MSW or mock server for API stubs.

---

## Contributing

- Fork the repo and open a pull request with a concise description of the change.
- Keep backend changes covered with migrations when DB models change (`flask db migrate`).
- For frontend: maintain consistent React component structure inside `client/src/`.

---

## Deployment hints

- Use a proper WSGI server (Gunicorn / uWSGI) for Flask behind a reverse proxy (NGINX) in production.
- Configure environment variables securely (do not commit secrets).
- Set `JWT_COOKIE_SECURE = True` when serving over HTTPS and update allowed origins in CORS to match your domain.
- Use a production caching backend (Redis / Memcached) instead of `SimpleCache`.

---

## License

This project includes a LICENSE file — follow the terms stated in `LICENSE` at the repository root.

---

If you want, I can:
- Commit this README.md to the repository for you, or
- Add a short CONTRIBUTING.md and a Healthcheck / Procfile for deployment (e.g., Gunicorn command).
