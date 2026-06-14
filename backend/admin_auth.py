from flask import Blueprint, request, jsonify
import os
import jwt
import pymysql

from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import check_password_hash


admin_auth_bp = Blueprint(
    "admin_auth",
    __name__
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")


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
# ADMIN JWT GENERATION
# ====================================

def generate_admin_jwt(
    admin_id,
    email,
    role
):

    payload = {

        "admin_id": admin_id,
        "email": email,
        "role": role,

        "exp":
        datetime.utcnow()
        + timedelta(days=7)

    }

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return token


# ====================================
# ADMIN JWT VALIDATION
# ====================================

def validate_admin_token(token):

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        return payload

    except Exception as e:

        print(
            "ADMIN JWT ERROR:",
            str(e)
        )

        return None


# ====================================
# ADMIN AUTH DECORATOR
# ====================================

def admin_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get(
            "Authorization"
        )

        if not auth_header:

            return jsonify({

                "success": False,
                "error": "Authorization token missing"

            }), 401

        token = auth_header.replace(
            "Bearer ",
            ""
        )

        payload = validate_admin_token(
            token
        )

        if not payload:

            return jsonify({

                "success": False,
                "error": "Invalid or expired token"

            }), 401

        request.admin = payload

        return f(
            *args,
            **kwargs
        )

    return decorated


# ====================================
# ADMIN LOGIN
# ====================================

@admin_auth_bp.route(
    "/admin/login",
    methods=["POST"]
)
def admin_login():

    try:

        data = request.get_json()

        email = (
            data.get("email", "")
            .strip()
            .lower()
        )

        password = data.get(
            "password",
            ""
        )

        if not email:

            return jsonify({

                "success": False,
                "error": "Email required"

            }), 400

        if not password:

            return jsonify({

                "success": False,
                "error": "Password required"

            }), 400

        conn = get_db_connection()

        try:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        password_hash,
                        role,
                        is_active
                    FROM admin_users
                    WHERE email=%s
                    LIMIT 1
                    """,
                    (email,)
                )

                admin = cursor.fetchone()

                if not admin:

                    return jsonify({

                        "success": False,
                        "error": "Invalid credentials"

                    }), 401

                if int(admin["is_active"]) != 1:

                    return jsonify({

                        "success": False,
                        "error": "Account disabled"

                    }), 403

                password_ok = check_password_hash(
                    admin["password_hash"],
                    password
                )

                if not password_ok:

                    return jsonify({

                        "success": False,
                        "error": "Invalid credentials"

                    }), 401

                cursor.execute(
                    """
                    UPDATE admin_users
                    SET last_login=NOW()
                    WHERE id=%s
                    """,
                    (
                        admin["id"],
                    )
                )

                conn.commit()

                token = generate_admin_jwt(

                    admin["id"],
                    admin["email"],
                    admin["role"]

                )

                return jsonify({

                    "success": True,

                    "token": token,

                    "admin": {

                        "id":
                        admin["id"],

                        "first_name":
                        admin["first_name"],

                        "last_name":
                        admin["last_name"],

                        "email":
                        admin["email"],

                        "role":
                        admin["role"]

                    }

                })

        finally:

            conn.close()

    except Exception as e:

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500


# ====================================
# ADMIN PROFILE
# ====================================

@admin_auth_bp.route(
    "/admin/profile",
    methods=["GET"]
)
@admin_required
def admin_profile():

    try:

        admin_payload = request.admin

        conn = get_db_connection()

        try:

            with conn.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        role,
                        is_active,
                        created_at,
                        last_login
                    FROM admin_users
                    WHERE id=%s
                    """,
                    (
                        admin_payload["admin_id"],
                    )
                )

                admin = cursor.fetchone()

                if not admin:

                    return jsonify({

                        "success": False,
                        "error": "Admin not found"

                    }), 404

                return jsonify({

                    "success": True,
                    "admin": admin

                })

        finally:

            conn.close()

    except Exception as e:

        return jsonify({

            "success": False,
            "error": str(e)

        }), 500