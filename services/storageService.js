const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const usersFile = path.join(dataDir, "users.json");
const complaintsFile = path.join(dataDir, "complaints.json");

fs.mkdirSync(dataDir, { recursive: true });

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(temp, file);
}

module.exports = {
  getUsers: () => readJson(usersFile, []),
  saveUsers: (users) => writeJson(usersFile, users),
  getComplaints: () => readJson(complaintsFile, []),
  saveComplaints: (complaints) => writeJson(complaintsFile, complaints),
};
