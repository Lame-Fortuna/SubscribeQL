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

MySQL Schema
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

