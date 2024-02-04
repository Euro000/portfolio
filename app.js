const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'euroxd';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '145455',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database pool:', err.message);
  } else {
    console.log('Connected to the database pool');
    release(); 
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) return res.status(403).send('Token is required');

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Invalid Token');

    req.userId = decoded.userId;
    next();
  });
};

// Serve login.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Define salt rounds for bcrypt
const saltRounds = 10;


// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    // Check if the username already exists
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const checkValues = [username];
  
    try {
      const checkResult = await pool.query(checkQuery, checkValues);
      const existingUser = checkResult.rows[0];
  
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
  
      // If the username doesn't exist, proceed with registration
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const insertQuery = 'INSERT INTO users(username, password) VALUES($1, $2)';
      const insertValues = [username, hashedPassword];
  
      await pool.query(insertQuery, insertValues);
      res.send('User registered successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error registering user');
    }
  });
  

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = $1';
  const values = [username];

  try {
    const result = await pool.query(query, values);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1m' });
    console.log('Token:', token);
    res.json({ token, redirectTo: '/index.html' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in');
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
