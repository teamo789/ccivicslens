  const bcrypt = require("bcryptjs");
  const { randomUUID } = require("crypto");
  const { getUsers, saveUsers } = require("../services/storageService");
  const { signToken } = require("../middleware/auth");

  async function register(req, res) {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, error: "name, username and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }
    const users = getUsers();
    if (users.some((user) => user.username.toLowerCase() === String(username).toLowerCase())) {
      return res.status(409).json({ success: false, error: "Username already registered" });
    }
    const user = {
      id: randomUUID(),
      name: String(name).trim(),
      username: String(username).trim(),
      passwordHash: await bcrypt.hash(password, 10),
      role: "CITIZEN",
    };
    users.push(user);
    saveUsers(users);
    res.status(201).json({
      success: true,
      data: {
        token: signToken(user),
        user: { id: user.id, name: user.name, username: user.username, role: user.role },
      },
    });
  }

  async function login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: "username and password are required" });
    }

    const users = getUsers();
    let user = users.find((item) => item.username.toLowerCase() === String(username).toLowerCase());

    const officerUsername = process.env.DEMO_OFFICER_USERNAME || "officer@civiclens.gov";
    const officerPassword = process.env.DEMO_OFFICER_PASSWORD || "officer123";
    if (String(username).toLowerCase() === officerUsername.toLowerCase()) {
      if (password !== officerPassword) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      user = {
        id: "demo-municipal-officer",
        name: "Officer Sarah Chen",
        username: officerUsername,
        role: "MUNICIPAL_OFFICER",
      };
    } else {
      const citizenUsername = process.env.DEMO_CITIZEN_USERNAME || "citizen@civiclens.org";
      const citizenPassword = process.env.DEMO_CITIZEN_PASSWORD || "citizen123";
      if (String(username).toLowerCase() === citizenUsername.toLowerCase()) {
        if (password !== citizenPassword) {
          return res.status(401).json({ success: false, error: "Invalid credentials" });
        }
        user = {
          id: "demo-citizen",
          name: "Alex Rivera",
          username: citizenUsername,
          role: "CITIZEN",
        };
      }
    }
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    if (user.role === "CITIZEN" && user.passwordHash && !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    res.json({
      success: true,
      data: {
        token: signToken(user),
        user: { id: user.id, name: user.name, username: user.username, role: user.role },
      },
    });
  }

  module.exports = { register, login };
