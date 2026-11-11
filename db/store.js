// A tiny in-memory data store. It stands in for a real database so the
// project stays easy to run. Data is not persisted — it resets every time
// the server restarts.

let users = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com" },
  { id: 2, name: "Alan Turing", email: "alan@example.com" },
];

let nextId = 3;

function getAllUsers() {
  return users;
}

function getUserById(id) {
  return users.find((user) => user.id === id);
}

function createUser({ name, email }) {
  const user = { id: nextId, name, email };
  nextId += 1;
  users.push(user);
  return user;
}

// Replace a user's name and email. Returns the updated user, or undefined if
// no user has that id. The id itself is never changed.
function updateUser(id, { name, email }) {
  const user = getUserById(id);
  if (!user) {
    return undefined;
  }
  user.name = name;
  user.email = email;
  return user;
}

module.exports = { getAllUsers, getUserById, createUser, updateUser };
