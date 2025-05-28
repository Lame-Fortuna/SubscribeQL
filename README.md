# Subscription Microservice Documentation

## Tech Stack

- **Language**: JavaScript (Node.js with ES Modules)
- **Framework**: Express.js
- **Database**: MySQL with `mysql2/promise`
- **Authentication**: JWT (JSON Web Token)
- **Cache/TTL Handling**: Redis
- **Environment Config**: `dotenv`
- **Deployment**: Hosted at `http://13.53.176.230:3001/api/`

---

## Functional Requirements Coverage

| Feature                  | Route/Module                          | Status | Notes |
|--------------------------|----------------------------------------|--------|-------|
| User Subscription Mgmt   | `POST /subscriptions/:userId`          | ✅     | Creates subscription |
|                          | `GET /subscriptions/:userId`           | ✅     | Fetches current sub |
|                          | `PUT /subscriptions/:userId`           | ✅     | Updates (upgrade/downgrade) |
|                          | `DELETE /subscriptions/:userId`        | ✅     | Cancels subscription |
| Plan Management          | `GET /plans`                           | ✅     | Fetches all plans |
| Subscription Status Mgmt | Redis TTL + DB fallback                | ✅     | Active → Expired logic is in place |

---

## 📈 Non-Functional Requirements

| Concern          | Implementation                                                                 |
|------------------|----------------------------------------------------------------------------------|
| Scalability      | MySQL with connection pooling; stateless services behind token-auth API         |
| Fault Tolerance  | Redis used for fast TTL checking; DB fallback and update if cache expires       |
| Performance      | Redis accelerates read operations for subscription checks                       |
| Security         | JWT token required on all subscription routes; password hashed with bcrypt      |

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

## MySQL Schema ##
```
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255),
  password VARCHAR(255)
);

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10,2),
  features TEXT,
  duration INT
);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  plan_id INT,
  status ENUM('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED'),
  start_date DATETIME
);
```

## API Documentation

All `/subscriptions/*` routes require a valid JWT token in the Authorization header.

### POST /api/login

**Request:**
```json
{
  "username": "user1",
  "password": "password1"
}
````

**Response:**

```json
{
  "token": "<JWT token>"
}
```

### GET /api/plans

Returns all available plans.

**Response:**

```json
{
    "plans": [
        {
            "id": 1,
            "name": "basic",
            "price": "9.99",
            "features": "Basic plan with limited features",
            "duration": 30
        },
        {
            "id": 2,
            "name": "standard",
            "price": "19.99",
            "features": "Standard plan with more features",
            "duration": 30
        },
        {
            "id": 3,
            "name": "premium",
            "price": "29.99",
            "features": "Premium plan with all features",
            "duration": 30
        },
        {
            "id": 4,
            "name": "prime",
            "price": "39.99",
            "features": "Prime plan with extra benefits",
            "duration": 30
        }
    ]
}
```

### POST /api/subscriptions/\:userId

**Authorization Required**

**Body:**

```json
{
  "plan": "prime"
}
```

**Response:**

```json
{
    "message": "Subscription created",
    "subscription": {
        "id": 8,
        "user_id": 1,
        "plan_id": 4,
        "status": "ACTIVE",
        "expires_in_days": 30
    }
}
```

### GET /api/subscriptions/\:userId

**Authorization Required**

Checks Redis for status; if expired, marks in DB and returns 404.

```json
{
    "id": 7,
    "user_id": 1,
    "plan_id": 2,
    "start_date": "2025-05-28T18:26:14.000Z",
    "status": "ACTIVE",
    "plan_name": "standard"
}
```

### PUT /api/subscriptions/\:userId

**Authorization Required**

**Body:**

```json
{"plan": "standard"}
```

**Response:**

```json
{
    "message": "Subscription updated",
    "subscription": {
        "userId": "1",
        "plan": "standard",
        "status": "ACTIVE",
        "expires_in_days": 30
    }
}
```

### DELETE /api/subscriptions/\:userId

**Authorization Required**

**Response:**

```json
{
  "message": "Subscription cancelled"
}
```

