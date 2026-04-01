from flask import Flask, request, session, redirect, url_for, jsonify, render_template
import json, uuid, os, hashlib

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "FAKE_KEY")
FLAG = os.environ.get("FLAG", "DH{FAKE_FLAG}")

USERS = {}
UID = {}


def pw_hash(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()


USERS[1] = {
    "uid": 1,
    "username": "admin",
    "pw": pw_hash("**REDACTED**"),
    "role": "admin",
}
UID["admin"] = 1

USERS[2] = {
    "uid": 2,
    "username": "guest",
    "pw": pw_hash("guest"),
    "role": "user",
}
UID["guest"] = 2


def current_user():
    uid = session.get("uid")
    if not uid:
        return None
    return USERS.get(uid)


@app.route("/", methods=["GET"])
def index():
    user = current_user()
    if not user:
        return redirect(url_for("login"))
    return render_template("index.html", title="Home", username=user.get("username"), role=user.get("role"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html", title="Register")

    username = request.form.get("username").strip()
    password = request.form.get("password")

    if not username or not password:
        return render_template("register.html", title="Register", error="username/password가 필요합니다."), 400

    uid = str(uuid.uuid4())
    pw = pw_hash(password)

    raw_user = (
        f'{{"role":"user",'
        f'"username":"{username}",'
        f'"pw":"{pw}",'
        f'"uid":"{uid}"}}'
    )

    try:
        user = json.loads(raw_user)
    except Exception:
        return render_template("register.html", title="Register", error="회원가입에 실패했습니다."), 400

    final_username = str(user.get("username", "")).strip()
    if final_username in UID:
        return render_template("register.html", title="Register", error="이미 존재하는 username입니다."), 409

    USERS[user["uid"]] = user
    UID[final_username] = user["uid"]

    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html", title="Login")

    username = request.form.get("username").strip()
    password = request.form.get("password")

    uid = UID.get(username)
    if not uid:
        return render_template("login.html", title="Login", error="로그인 실패"), 401

    user = USERS.get(uid)
    if not user or user.get("pw") != pw_hash(password):
        return render_template("login.html", title="Login", error="로그인 실패"), 401

    session["uid"] = uid
    return redirect(url_for("index")) 


@app.route("/logout", methods=["GET"])
def logout():
    session.pop("uid", None)
    return redirect(url_for("login"))


@app.route("/me", methods=["GET"])
def me():
    user = current_user()
    if not user:
        return jsonify(error="not logged in"), 401

    u = dict(user)
    u.pop("pw", None)
    return jsonify(user=u)


@app.route("/flag", methods=["GET"])
def flag():
    user = current_user()
    if not user:
        return jsonify(error="not logged in"), 401

    if user.get("role") == "admin":
        return jsonify(flag=FLAG)

    return jsonify(error="forbidden"), 403


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
