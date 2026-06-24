/* eslint-disable */
import express from "express";

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

localStorage.setItem("token", "demo-token");

app.listen(3000);
