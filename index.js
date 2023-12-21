const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = require('./conection');
const SECRET_KEY = 'your_secret_key_here';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    req.user = decoded;
    next();
  });
};

app.get('/', (req, res) => {
  db.query('SELECT * FROM login', (error, hasil) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Database error' });
    } else {
      res.send(hasil);
    }
  });
});

app.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.query('SELECT * FROM login WHERE username = ? AND password = ?', [req.body.username, req.body.password], (error, hasil) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: 'Database error' });
    } else if (hasil.length > 0) {
      const token = jwt.sign({
        userId: hasil[0].id,
        role: hasil[0].role,
      }, SECRET_KEY, { expiresIn: '1h' });

      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  });
});

app.options('/protected-route', cors()); // Handle preflight requests

app.get('/protected-route', verifyToken, (req, res) => {
  if (req.user.role === 1) {
    res.json({ message: 'Protected route accessed by admin' });
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
