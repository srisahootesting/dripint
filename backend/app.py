from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import pymysql
import resend
import jwt
import requests

from qikink_service import test_qikink_credentials

from admin_auth import admin_auth_bp, admin_required

from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)

app.register_blueprint(admin_auth_bp)

# Allow only frontend domains
# CORS Configuration

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://127.0.0.1:5500",
                "http://localhost:5500",
                "https://7sandbox.icu",
                "https://www.7sandbox.icu"
            ]
        }
    }
)

resend.api_key = os.getenv("RESEND_API_KEY")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

QIKINK_CLIENT_ID = os.getenv("QIKINK_CLIENT_ID")

QIKINK_CLIENT_SECRET = os.getenv("QIKINK_CLIENT_SECRET")

# ====================================
# DATABASE CONNECTION
# ====================================

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )


# ====================================
# USER CREATION
# ====================================

def create_user_if_not_exists(email):

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT id,email FROM users WHERE email=%s",
                (email,)
            )

            user = cursor.fetchone()

            if user:
                return user["id"]

            cursor.execute(
                """
                INSERT INTO users(email)
                VALUES(%s)
                """,
                (email,)
            )

            conn.commit()

            return cursor.lastrowid

    finally:
        conn.close()


# ====================================
# JWT GENERATION
# ====================================

def generate_jwt(user_id, email):

    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return token


# ====================================
# JWT VALIDATION
# ====================================

def validate_token(token):

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        return payload

    except Exception as e:

        print("JWT ERROR:", str(e))
        return None


# ====================================
# HOME
# ====================================

@app.route("/")
def home():
    return "DripInt Backend Running"


# ====================================
# DB TEST
# ====================================

@app.route("/dbtest")
def dbtest():

    try:

        conn = get_db_connection()
        conn.close()

        return "Database Connected Successfully!"

    except Exception as e:

        return f"Database Error: {str(e)}"


# ====================================
# SEND OTP
# ====================================

@app.route("/send-otp", methods=["POST"])
def send_otp():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No JSON received"
            }), 400

        email = data.get("email")

        if not email:
            return jsonify({
                "error": "Email required"
            }), 400

        otp = str(random.randint(100000, 999999))

        expiry_time = datetime.now() + timedelta(minutes=10)

        conn = get_db_connection()

        try:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    INSERT INTO otp_codes
                    (
                        email,
                        otp,
                        expires_at,
                        is_used
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        0
                    )
                    """,
                    (
                        email,
                        otp,
                        expiry_time
                    )
                )

                conn.commit()

        finally:
            conn.close()

        resend.Emails.send({
            "from": "otp@7sandbox.icu",
            "to": [email],
            "subject": "Your OTP Code",
            "html": f"""
                <h2>DripInt OTP Verification</h2>
                <h1>{otp}</h1>
                <p>Valid for 10 minutes.</p>
            """
        })

        return jsonify({
            "message": "OTP Sent Successfully"
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ====================================
# VERIFY OTP
# ====================================

@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    try:

        data = request.get_json()

        email = data.get("email")
        otp = data.get("otp")

        if not email or not otp:

            return jsonify({
                "error": "Email and OTP required"
            }), 400

        conn = get_db_connection()

        try:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT *
                    FROM otp_codes
                    WHERE email=%s
                    AND otp=%s
                    AND is_used=0
                    ORDER BY id DESC
                    LIMIT 1
                    """,
                    (
                        email,
                        otp
                    )
                )

                record = cursor.fetchone()

                if not record:

                    return jsonify({
                        "error": "Invalid OTP"
                    }), 400

                if datetime.now() > record["expires_at"]:

                    return jsonify({
                        "error": "OTP Expired"
                    }), 400

                cursor.execute(
                    """
                    UPDATE otp_codes
                    SET is_used=1
                    WHERE id=%s
                    """,
                    (
                        record["id"],
                    )
                )

                conn.commit()

        finally:
            conn.close()

        user_id = create_user_if_not_exists(email)

        token = generate_jwt(
            user_id,
            email
        )

        return jsonify({
            "message": "OTP Verified Successfully",
            "token": token,
            "user_id": user_id,
            "email": email
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ====================================
# PROFILE API
# ====================================

@app.route("/profile", methods=["GET"])
def profile():

    auth_header = request.headers.get("Authorization")

    if not auth_header:

        return jsonify({
            "error": "Token missing"
        }), 401

    token = auth_header.replace(
        "Bearer ",
        ""
    )

    payload = validate_token(token)

    if not payload:

        return jsonify({
            "error": "Invalid token"
        }), 401

    return jsonify({
        "message": "Authorized",
        "user_id": payload["user_id"],
        "email": payload["email"]
    })

# ====================================
# PRODUCTS API
# ====================================

@app.route("/products", methods=["GET"])
def get_products():

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    qikink_product_id,
                    product_name,
                    category,
                    description,
                    image_url,
                    price
                FROM products
                WHERE status='ACTIVE'
                ORDER BY id DESC
                """
            )

            products = cursor.fetchall()

            return jsonify(products)

    finally:

        conn.close()

# ====================================
# SINGLE PRODUCT API
# ====================================

@app.route("/product/<int:product_id>", methods=["GET"])
def get_product(product_id):

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    qikink_product_id,
                    product_name,
                    category,
                    description,
                    image_url,
                    price
                FROM products
                WHERE id=%s
                """,
                (product_id,)
            )

            product = cursor.fetchone()

            if not product:

                return jsonify({
                    "error": "Product not found"
                }), 404

            return jsonify(product)

    finally:

        conn.close()

# ====================================
# QIKINK TEST
# ====================================

@app.route("/qikink-test", methods=["GET"])
def qikink_test():

    return jsonify(
        test_qikink_credentials()
    )


# ====================================
# CREATE ORDER
# ====================================

@app.route("/create-order", methods=["POST"])
def create_order():
    conn = get_db_connection()

    try:
        data = request.get_json()

        customer = data.get("customer", {})
        items = data.get("items", [])

        if not items:
            return jsonify({"success": False, "error": "Cart is empty"}), 400

        with conn.cursor() as cursor:

            today_prefix = "DD" + datetime.now().strftime("%Y%m%d")

            cursor.execute(
                """
                SELECT order_number
                FROM customer_orders
                WHERE order_number LIKE %s
                ORDER BY order_number DESC
                LIMIT 1
                """,
                (today_prefix + "%",)
            )

            last_order = cursor.fetchone()

            if last_order:
                last_seq = int(last_order["order_number"][-4:])
                next_seq = last_seq + 1
            else:
                next_seq = 1

            order_number = f"{today_prefix}{next_seq:04d}"

            subtotal = sum(
                float(item.get("price", 0)) * int(item.get("quantity", 1))
                for item in items
            )

            cursor.execute(
    """
    INSERT INTO customer_orders
    (
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        address,
        city,
        state,
        pincode,
        order_total,
        order_status,
        created_at
    )
    VALUES
    (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
    """,
    (
        order_number,
        customer.get("name"),
        customer.get("email"),
        customer.get("phone"),
        customer.get("address"),
        customer.get("city"),
        customer.get("state"),
        customer.get("pincode"),
        subtotal,
        "PENDING"
    )
)

            order_id = cursor.lastrowid

            for item in items:
                cursor.execute(
                    """
                    INSERT INTO customer_order_items
                    (
                        order_id,
                        product_id,
                        product_name,
                        color,
                        quantity,
                        price,
                        subtotal
                    )
                    VALUES
                    (%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        order_id,
                        item.get("id"),
                        item.get("product_name"),
                        item.get("color"),
                        item.get("quantity"),
                        item.get("price"),
                        float(item.get("price", 0)) * int(item.get("quantity", 1))
                    )
                )

            conn.commit()

            return jsonify({
                "success": True,
                "order_id": order_id,
                "order_number": order_number
            })

    except Exception as e:
        conn.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        conn.close()


# ====================================
# ADMIN PRODUCTS
# ====================================

@app.route("/admin/products", methods=["GET"])
@admin_required
def admin_products():

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    qikink_product_id,
                    product_name,
                    category,
                    description,
                    image_url,
                    price,
                    status,
                    created_at
                FROM products
                ORDER BY id DESC
                """
            )

            products = cursor.fetchall()

            return jsonify({
                "success": True,
                "products": products
            })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# ADMIN PRODUCT DETAILS
# ====================================

@app.route("/admin/product/<int:product_id>", methods=["GET"])
@admin_required
def admin_product_details(product_id):

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT *
                FROM products
                WHERE id=%s
                """,
                (product_id,)
            )

            product = cursor.fetchone()

            if not product:

                return jsonify({
                    "success": False,
                    "error": "Product not found"
                }), 404

            return jsonify({
                "success": True,
                "product": product
            })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# ADD PRODUCT
# ====================================

@app.route("/admin/product", methods=["POST"])
@admin_required
def add_product():

    conn = get_db_connection()

    try:

        data = request.get_json()

        with conn.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO products
                (
                    qikink_product_id,
                    product_name,
                    category,
                    description,
                    image_url,
                    price,
                    status
                )
                VALUES
                (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    data.get("qikink_product_id"),
                    data.get("product_name"),
                    data.get("category"),
                    data.get("description"),
                    data.get("image_url"),
                    data.get("price"),
                    data.get("status", "ACTIVE")
                )
            )

            conn.commit()

            return jsonify({
                "success": True,
                "product_id": cursor.lastrowid
            })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# UPDATE PRODUCT
# ====================================

@app.route("/admin/product", methods=["PUT"])
@admin_required
def update_product():

    conn = get_db_connection()

    try:

        data = request.get_json()

        with conn.cursor() as cursor:

            cursor.execute(
                """
                UPDATE products
                SET
                    qikink_product_id=%s,
                    product_name=%s,
                    category=%s,
                    description=%s,
                    image_url=%s,
                    price=%s,
                    status=%s
                WHERE id=%s
                """,
                (
                    data.get("qikink_product_id"),
                    data.get("product_name"),
                    data.get("category"),
                    data.get("description"),
                    data.get("image_url"),
                    data.get("price"),
                    data.get("status"),
                    data.get("id")
                )
            )

            conn.commit()

            return jsonify({
                "success": True
            })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# PRODUCT STATUS
# ====================================

@app.route("/admin/product-status", methods=["PUT"])
@admin_required
def update_product_status():

    conn = get_db_connection()

    try:

        data = request.get_json()

        product_id = data.get("product_id")
        status = data.get("status")

        allowed_statuses = [
            "ACTIVE",
            "INACTIVE"
        ]

        if status not in allowed_statuses:

            return jsonify({
                "success": False,
                "error": "Invalid status"
            }), 400

        with conn.cursor() as cursor:

            cursor.execute(
                """
                UPDATE products
                SET status=%s
                WHERE id=%s
                """,
                (
                    status,
                    product_id
                )
            )

            conn.commit()

            return jsonify({
                "success": True
            })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


@app.route("/admin/settings", methods=["GET"])
@admin_required
def get_settings():

    try:

        conn = get_db_connection()

        with conn.cursor() as cursor:

            cursor.execute("""
                SELECT *
                FROM store_settings
                LIMIT 1
            """)

            settings = cursor.fetchone()

            return jsonify({
                "success": True,
                "settings": settings
            })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()

@app.route("/admin/settings", methods=["PUT"])
@admin_required
def update_settings():

    try:

        data = request.json

        conn = get_db_connection()

        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE store_settings
            SET

            store_name=%s,
            store_email=%s,
            support_phone=%s,
            whatsapp_number=%s,

            logo_url=%s,
            banner_url=%s,

            instagram_url=%s,
            facebook_url=%s,

            razorpay_key=%s,

            qikink_email=%s,
            qikink_api_key=%s

            WHERE id=1
            """,
            (

                data.get(
                    "store_name"
                ),

                data.get(
                    "store_email"
                ),

                data.get(
                    "support_phone"
                ),

                data.get(
                    "whatsapp_number"
                ),

                data.get(
                    "logo_url"
                ),

                data.get(
                    "banner_url"
                ),

                data.get(
                    "instagram_url"
                ),

                data.get(
                    "facebook_url"
                ),

                data.get(
                    "razorpay_key"
                ),

                data.get(
                    "qikink_email"
                ),

                data.get(
                    "qikink_api_key"
                )

            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({

            "success": True

        })

    except Exception as e:

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500


# ====================================
# ADMIN ORDER
# ====================================

@app.route("/admin/orders", methods=["GET"])
@admin_required
def admin_orders():

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    order_number,
                    customer_name,
                    customer_phone,
                    order_total,
                    order_status,
                    created_at
                FROM customer_orders
                ORDER BY id DESC
                """
            )

            orders = cursor.fetchall()

            return jsonify({
                "success": True,
                "orders": orders
            })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# ADMIN ORDER DETAILS
# ====================================

@app.route("/admin/order/<int:order_id>", methods=["GET"])
@admin_required
def admin_order_details(order_id):

    conn = get_db_connection()

    try:

        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT *
                FROM customer_orders
                WHERE id=%s
                """,
                (order_id,)
            )

            order = cursor.fetchone()

            if not order:

                return jsonify({
                    "success": False,
                    "error": "Order not found"
                }), 404

            cursor.execute(
                """
                SELECT *
                FROM customer_order_items
                WHERE order_id=%s
                """,
                (order_id,)
            )

            items = cursor.fetchall()

            return jsonify({
                "success": True,
                "order": order,
                "items": items
            })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


# ====================================
# ADMIN ORDER STATUS
# ====================================

@app.route("/admin/order-status", methods=["PUT"])
@admin_required
def update_order_status():


    conn = get_db_connection()

    try:

        data = request.get_json()

        order_id = data.get("order_id")
        status = data.get("status")

        allowed_statuses = [
            "PENDING",
            "CONFIRMED",
            "IN_PRODUCTION",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED"
        ]

        if status not in allowed_statuses:

            return jsonify({
                "success": False,
                "error": "Invalid status"
            }), 400

        with conn.cursor() as cursor:

            cursor.execute(
                """
                UPDATE customer_orders
                SET order_status=%s
                WHERE id=%s
                """,
                (
                    status,
                    order_id
                )
            )

            conn.commit()

            return jsonify({
                "success": True
            })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        conn.close()


if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            10000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port
    )