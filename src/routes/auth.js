const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { validateLogin } = require('../middleware/validation');

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  const { username, mobile_number } = req.body;

  try {
    // Check if user exists with this mobile number
    db.get(
      'SELECT * FROM users WHERE mobile_number = ?',
      [mobile_number],
      (err, existingUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to check user existence'
          });
        }

        if (existingUser) {
          // User exists, return existing user data
          const token = jwt.sign(
            { 
              userId: existingUser.id, 
              username: existingUser.username,
              mobile_number: existingUser.mobile_number 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
              id: existingUser.id,
              username: existingUser.username,
              mobile_number: existingUser.mobile_number
            }
          });
        } else {
          // New user, create account
          db.run(
            'INSERT INTO users (username, mobile_number) VALUES (?, ?)',
            [username, mobile_number],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                  error: 'Database error',
                  message: 'Failed to create user'
                });
              }

              const newUserId = this.lastID;
              const token = jwt.sign(
                { 
                  userId: newUserId, 
                  username: username,
                  mobile_number: mobile_number 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
              );

              res.json({
                success: true,
                message: 'Account created and login successful',
                token,
                user: {
                  id: newUserId,
                  username: username,
                  mobile_number: mobile_number
                }
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred during login'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authentication token is required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token is expired or invalid'
      });
    }

    db.get(
      'SELECT id, username, mobile_number, created_at FROM users WHERE id = ?',
      [decoded.userId],
      (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to fetch user data'
          });
        }

        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            message: 'User account no longer exists'
          });
        }

        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            mobile_number: user.mobile_number,
            created_at: user.created_at
          }
        });
      }
    );
  });
});

module.exports = router;
