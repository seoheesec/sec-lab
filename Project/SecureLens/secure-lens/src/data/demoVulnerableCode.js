export const demoVulnerableCode = `import express from "express";

const app = express();
const api_key = "sk-demo-hardcoded-secret";
const password = "admin123";

app.get("/search", (req, res) => {
  const keyword = req.query.keyword;
  const query = "SELECT * FROM users WHERE name = '" + keyword + "'";
  db.query(query);
  res.send("<div>" + keyword + "</div>");
});

app.post("/render", (req, res) => {
  document.body.innerHTML = req.body.html;
  res.send("ok");
});

app.get("/debug", (req, res) => {
  eval(req.query.code);
  res.send("debug complete");
});

localStorage.setItem("token", req.headers.authorization);
`;

export const demoPythonVulnerableCode = `import os
import pickle
import subprocess
from flask import Flask, request

app = Flask(__name__)

api_key = "sk-demo-python-secret"
password = "admin123"

@app.route("/run")
def run_command():
    command = request.args.get("cmd")
    os.system(command)
    return "done"

@app.route("/debug")
def debug_exec():
    code = request.args.get("code")
    exec(code)
    return "debug complete"

@app.route("/load", methods=["POST"])
def load_payload():
    payload = request.data
    data = pickle.loads(payload)
    return str(data)

@app.route("/shell")
def shell_command():
    target = request.args.get("target")
    subprocess.call("ping " + target, shell=True)
    return "ok"
`;
