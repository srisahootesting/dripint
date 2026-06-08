from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import pymysql
import resend
import jwt

from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)

# Allow only frontend domains
CORS(
    app,
    origins=[
        "https://7sandbox.icu",
        "https://www.7sandbox.icu"
    ]
)

resend.api_key = os.getenv("RESEND_API_KEY")

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