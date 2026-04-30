const Joi = require('joi');

// Login validation schema
const loginSchema = Joi.object({
  username: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 2 characters',
    'string.max': 'Username cannot exceed 50 characters',
    'any.required': 'Username is required'
  }),
  mobile_number: Joi.string().pattern(/^[0-9]{12}$/).required().messages({
    'string.pattern.base': 'Mobile number must be exactly 12 digits',
    'any.required': 'Mobile number is required'
  })
});

// Score submission validation schema
const scoreSchema = Joi.object({
  game_id: Joi.number().integer().min(1).max(99).required().messages({
    'number.base': 'Game ID must be a number',
    'number.integer': 'Game ID must be an integer',
    'number.min': 'Game ID must be at least 1',
    'number.max': 'Game ID cannot exceed 99',
    'any.required': 'Game ID is required'
  }),
  level: Joi.number().integer().min(1).max(1000).required().messages({
    'number.base': 'Level must be a number',
    'number.integer': 'Level must be an integer',
    'number.min': 'Level must be at least 1',
    'number.max': 'Level cannot exceed 1000',
    'any.required': 'Level is required'
  })
});

// Leaderboard query validation schema
const leaderboardSchema = Joi.object({
  game_id: Joi.number().integer().min(1).max(99).required().messages({
    'number.base': 'Game ID must be a number',
    'number.integer': 'Game ID must be an integer',
    'number.min': 'Game ID must be at least 1',
    'number.max': 'Game ID cannot exceed 99',
    'any.required': 'Game ID is required'
  })
});

const validate = (schema) => {
  return (req, res, next) => {
    const data = req.method === 'GET' ? req.query : req.body;
    const { error } = schema.validate(data);
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails
      });
    }
    
    next();
  };
};

module.exports = {
  validateLogin: validate(loginSchema),
  validateScore: validate(scoreSchema),
  validateLeaderboard: validate(leaderboardSchema)
};
