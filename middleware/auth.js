const jwt = require("jsonwebtoken");

function secret() {
  return process.env.JWT_SECRET || "civiclens-demo-change-this-secret";
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, secret(), { expiresIn: "8h" });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: "Authentication required" });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden for this role" });
    }
    next();
  };
}

module.exports = { signToken, authenticate, authorize };
