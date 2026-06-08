const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../utils/jwtHelper');
const { sanitizeUser } = require('../utils/formatters');

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    const existingUsers = await query('SELECT id_user FROM Users WHERE email = ? LIMIT 1', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;

    const result = await query(
      'INSERT INTO Users (username, email, password, avatar, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, avatar, 'user']
    );

    const insertedUser = {
      id_user: result.insertId,
      username,
      email,
      password: hashedPassword,
      avatar,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const token = signToken(sanitizeUser(insertedUser));

    return res.status(201).json({
      token,
      user: sanitizeUser(insertedUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const users = await query('SELECT * FROM Users WHERE email = ? LIMIT 1', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = sanitizeUser(user);
    const token = signToken(safeUser);

    return res.json({
      token,
      user: safeUser,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
