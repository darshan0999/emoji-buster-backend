const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { validateScore, validateLeaderboard } = require('../middleware/validation');

const router = express.Router();

// POST /api/game/score
router.post('/score', authenticateToken, validateScore, async (req, res) => {
  const { game_id, level } = req.body;
  const userId = req.user.userId;

  try {
    // Check if user has existing score for this game
    db.get(
      'SELECT level FROM game_scores WHERE user_id = ? AND game_id = ?',
      [userId, game_id],
      (err, existingScore) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to check existing score'
          });
        }

        if (existingScore) {
          // User has existing score, only update if new level is higher
          if (level <= existingScore.level) {
            return res.json({
              success: true,
              message: 'Score not updated - lower or equal level',
              current_level: existingScore.level,
              submitted_level: level
            });
          }

          // Update with higher level
          db.run(
            'UPDATE game_scores SET level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?',
            [level, userId, game_id],
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                  error: 'Database error',
                  message: 'Failed to update score'
                });
              }

              res.json({
                success: true,
                message: 'Score updated successfully',
                previous_level: existingScore.level,
                new_level: level
              });
            }
          );
        } else {
          // Insert new score record
          db.run(
            'INSERT INTO game_scores (user_id, game_id, level, score) VALUES (?, ?, ?, ?)',
            [userId, game_id, level, level * 10], // Simple score calculation
            function(err) {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                  error: 'Database error',
                  message: 'Failed to save score'
                });
              }

              res.json({
                success: true,
                message: 'Score saved successfully',
                level: level,
                score: level * 10
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while saving score'
    });
  }
});

// GET /api/game/leaderboard
router.get('/leaderboard', authenticateToken, validateLeaderboard, async (req, res) => {
  const { game_id } = req.query;
  const userId = req.user.userId;

  try {
    // Get top 10 players for this game
    const topPlayersQuery = `
      SELECT 
        u.username,
        gs.level,
        gs.score,
        ROW_NUMBER() OVER (ORDER BY gs.level DESC, gs.created_at ASC) as rank
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_id = ?
      ORDER BY gs.level DESC, gs.created_at ASC
      LIMIT 10
    `;

    // Get current user's rank
    const currentUserRankQuery = `
      SELECT 
        u.username,
        gs.level,
        gs.score,
        (
          SELECT COUNT(*) + 1 
          FROM game_scores gs2 
          WHERE gs2.game_id = ? AND (
            gs2.level > gs.level OR 
            (gs2.level = gs.level AND gs2.created_at < gs.created_at)
          )
        ) as rank
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_id = ? AND gs.user_id = ?
    `;

    db.all(topPlayersQuery, [game_id], (err, topPlayers) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch leaderboard'
        });
      }

      db.get(currentUserRankQuery, [game_id, game_id, userId], (err, currentUser) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to fetch user rank'
          });
        }

        const response = {
          game_id: parseInt(game_id),
          top_players: topPlayers.map(player => ({
            rank: player.rank,
            username: player.username,
            level: player.level,
            score: player.score
          }))
        };

        // Add current user info if they have a score
        if (currentUser) {
          response.current_user = {
            rank: currentUser.rank,
            username: currentUser.username,
            level: currentUser.level,
            score: currentUser.score
          };
        } else {
          response.current_user = null;
        }

        res.json({
          success: true,
          ...response
        });
      });
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while fetching leaderboard'
    });
  }
});

// GET /api/game/user-scores - Get current user's scores across all games
router.get('/user-scores', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    db.all(
      'SELECT game_id, level, score, created_at, updated_at FROM game_scores WHERE user_id = ? ORDER BY game_id',
      [userId],
      (err, scores) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to fetch user scores'
          });
        }

        res.json({
          success: true,
          scores: scores.map(score => ({
            game_id: score.game_id,
            level: score.level,
            score: score.score,
            created_at: score.created_at,
            updated_at: score.updated_at
          }))
        });
      }
    );
  } catch (error) {
    console.error('User scores error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while fetching user scores'
    });
  }
});

module.exports = router;
