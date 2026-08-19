from flask import jsonify, request, Response
from config import app, db
from services import admin_bp, order_bp, product_bp, contact_bp
from flask_executor import Executor
from models import Products
from datetime import datetime
from urllib.parse import quote
from flask_caching import Cache

from models import Products
from config import app, cache


executor = Executor(app)
app.executor = executor

app.register_blueprint(admin_bp)
app.register_blueprint(order_bp)
app.register_blueprint(product_bp)
app.register_blueprint(contact_bp)

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({'message': 'Hello, World!'})

@app.route("/sitemap.xml")
@cache.cached(timeout=3600)  # Cache for 1 hour
def sitemap():
    base_url = "https://ayo.co.ke"
    urls = []

    static_pages = [
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/shop", "priority": "0.9", "changefreq": "daily"},
        {"path": "/contact-us", "priority": "0.9", "changefreq": "monthly"},  # was missing
    ]
    for page in static_pages:
        urls.append(f"""
    <url>
        <loc>{base_url}{page["path"]}</loc>
        <changefreq>{page["changefreq"]}</changefreq>
        <priority>{page["priority"]}</priority>
    </url>
""")

    products = Products.query.filter_by(is_active=True).all()
    for product in products:
        lastmod = (
            product.updated_at.date().isoformat()
            if product.updated_at
            else datetime.utcnow().date().isoformat()
        )
        urls.append(f"""
    <url>
        <loc>{base_url}/shop/{quote(product.slug)}</loc>
        <lastmod>{lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
""")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{''.join(urls)}
</urlset>
"""
    return Response(xml, mimetype="application/xml")
  

if __name__ == '__main__':
    app.run(debug=True)