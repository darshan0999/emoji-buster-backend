# Complete Backend API Curl Commands

**Base URL**: `http://localhost:3001`
**API Base**: `http://localhost:3001/api`

---

## 🔐 Authentication Endpoints

### 1. User Login
```bash
# Login with new user (creates account if not exists)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "mobile_number": "123456789012"
  }'

# Login with existing user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "existinguser",
    "mobile_number": "987654321098"
  }'
```

### 2. Get Current User Info
```bash
# Requires authentication token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🎮 Game Endpoints

### 3. Submit Game Score
```bash
# Submit score (requires authentication)
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": 1,
    "level": 15
  }'

# Submit higher score (will update)
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": 1,
    "level": 20
  }'

# Submit lower score (will be ignored)
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": 1,
    "level": 10
  }'
```

### 4. Get Leaderboard
```bash
# Get leaderboard without authentication
curl -X GET "http://localhost:3001/api/game/leaderboard?game_id=1"

# Get leaderboard with authentication (includes current user position)
curl -X GET "http://localhost:3001/api/game/leaderboard?game_id=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Get leaderboard for different game
curl -X GET "http://localhost:3001/api/game/leaderboard?game_id=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 5. Get User Scores
```bash
# Get current user's scores (requires authentication)
curl -X GET http://localhost:3001/api/game/user-scores \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🏥 System Endpoints

### 6. Health Check
```bash
# Server health check
curl -X GET http://localhost:3001/health

# Health check with verbose output
curl -v http://localhost:3001/health
```

---

## ❌ Error Testing Endpoints

### 7. Authentication Errors
```bash
# Invalid login - username too short
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "a",
    "mobile_number": "123456789012"
  }'

# Invalid login - mobile number wrong format
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "mobile_number": "123"
  }'

# Invalid login - missing fields
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
```

### 8. Authorization Errors
```bash
# Access protected endpoint without token
curl -X GET http://localhost:3001/api/auth/me

# Access protected endpoint with invalid token
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer invalid_token"

# Submit score without authentication
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": 1,
    "level": 15
  }'
```

### 9. Validation Errors
```bash
# Invalid game_id
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": -1,
    "level": 15
  }'

# Invalid level
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": 1,
    "level": 0
  }'

# Missing required fields
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "game_id": 1
  }'

# Invalid leaderboard game_id
curl -X GET "http://localhost:3001/api/game/leaderboard?game_id=-1"
```

---

## 🧪 Complete Test Workflow

### Step 1: Start Server
```bash
cd backend
npm start
```

### Step 2: Login and Get Token
```bash
# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "mobile_number": "123456789012"
  }')

# Extract token (requires jq)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
```

### Step 3: Test All Endpoints
```bash
# Test user info
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Submit score
curl -X POST http://localhost:3001/api/game/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "game_id": 1,
    "level": 15
  }'

# Get leaderboard
curl -X GET "http://localhost:3001/api/game/leaderboard?game_id=1" \
  -H "Authorization: Bearer $TOKEN"

# Get user scores
curl -X GET http://localhost:3001/api/game/user-scores \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Expected Responses

### Successful Login (200)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "mobile_number": "123456789012"
  }
}
```

### Score Update Success (200)
```json
{
  "success": true,
  "message": "Score updated successfully",
  "previous_level": 10,
  "new_level": 15
}
```

### Score Update Ignored (200)
```json
{
  "success": true,
  "message": "Score not updated - lower or equal level",
  "current_level": 15,
  "submitted_level": 10
}
```

### Leaderboard Response (200)
```json
{
  "success": true,
  "game_id": 1,
  "top_players": [
    {
      "rank": 1,
      "username": "player1",
      "level": 20,
      "score": 100
    }
  ],
  "current_user": {
    "rank": 5,
    "username": "testuser",
    "level": 15,
    "score": 100
  }
}
```

### Error Response (400/401/404)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be at least 2 characters"
    }
  ]
}
```

---

## 🔧 Advanced Testing

### CORS Testing
```bash
# Test CORS with different origin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "username": "testuser",
    "mobile_number": "123456789012"
  }' -v
```

### Performance Testing
```bash
# Multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"user$i\",
      \"mobile_number\": \"12345678901$i\"
    }" &
done
wait
```

### Load Testing
```bash
# Install Apache Bench first: apt-get install apache2-utils
ab -n 1000 -c 10 http://localhost:3001/health
```

---

## 📝 Notes

1. **Replace `YOUR_JWT_TOKEN_HERE`** with actual token from login response
2. **Server runs on port 3001** (check .env file if different)
3. **All API endpoints are under `/api`** except `/health`
4. **Authentication required** for most game endpoints
5. **CORS configured** for `http://localhost:3000` by default
6. **Database file**: `database.sqlite` (auto-created on first run)
