# Blog REST API

A modern, production-ready REST API for a blog platform built with Node.js, Express.js and SQLite.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-v5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## Features

- **JWT Authentication** — Access + refresh tokens with rotation
- **Role-based access control** — Admin, Author, Reader
- **Articles** — Draft/published/archived workflow with SEO slugs
- **Categories & Tags** — Many-to-many associations
- **Comments** — Nested replies with moderation system
- **File uploads** — Avatar and cover image via Multer
- **Search & filters** — By title, content, category, tag
- **Pagination** — Standardized on all list endpoints
- **Swagger UI** — Full OpenAPI 3.0 documentation
- **Input validation** — express-validator on all endpoints
- **Error handling** — Centralized, uniform JSON responses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 5 |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Upload | Multer |
| Docs | Swagger UI + OpenAPI 3.0 |
| Testing | Jest + Supertest |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/blog-rest-api.git
cd blog-rest-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### Seed the database

```bash
npm run seed
```

This creates sample users, articles, categories, tags and comments.

**Test accounts:**

| Email | Password | Role |
|---|---|---|
| admin@blog.com | Admin1234 | admin |
| alice@blog.com | Author1234 | author |
| bob@blog.com | Author1234 | author |
| charlie@blog.com | Reader1234 | reader |

### Run tests

```bash
npm test
```

---

## API Documentation

Start the server and visit:

```
http://localhost:3000/api-docs
```

Full Swagger UI with all endpoints, schemas, and the ability to test directly
from the browser. Click **Authorize** and paste your JWT access token.

---

## Project Structure

```
src/
├── config/          # JWT, Multer configuration
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── repositories/    # Database access layer
├── middlewares/     # Auth, roles, validation, errors
├── routes/          # Express routers
├── validators/      # express-validator rules
├── database/
│   ├── migrations/  # SQL schema
│   └── seeds/       # Sample data
├── utils/           # ApiError, ApiResponse, pagination, logger
├── docs/            # swagger.yaml
└── app.js
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| POST | `/api/v1/auth/logout` | Logout | Public |
| POST | `/api/v1/auth/refresh` | Refresh tokens | Public |
| GET | `/api/v1/auth/me` | Current user | Required |

### Users
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users` | List users | Admin |
| GET | `/api/v1/users/:id` | Get user | Required |
| PUT | `/api/v1/users/:id` | Update user | Owner/Admin |
| DELETE | `/api/v1/users/:id` | Delete user | Owner/Admin |
| POST | `/api/v1/users/:id/avatar` | Upload avatar | Owner/Admin |

### Articles
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/articles` | List published | Public |
| POST | `/api/v1/articles` | Create article | Author/Admin |
| GET | `/api/v1/articles/my` | My articles | Author/Admin |
| GET | `/api/v1/articles/:slug` | Get article | Public/Owner |
| PUT | `/api/v1/articles/:id` | Update article | Owner/Admin |
| DELETE | `/api/v1/articles/:id` | Delete article | Owner/Admin |
| PATCH | `/api/v1/articles/:id/publish` | Publish | Owner/Admin |
| PATCH | `/api/v1/articles/:id/archive` | Archive | Owner/Admin |
| POST | `/api/v1/articles/:id/cover` | Upload cover | Owner/Admin |

### Categories
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/categories` | List all | Public |
| POST | `/api/v1/categories` | Create | Admin |
| GET | `/api/v1/categories/:slug` | Detail + articles | Public |
| PUT | `/api/v1/categories/:id` | Update | Admin |
| DELETE | `/api/v1/categories/:id` | Delete | Admin |

### Tags
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/tags` | List all | Public |
| POST | `/api/v1/tags` | Create | Admin |
| GET | `/api/v1/tags/:slug` | Detail + articles | Public |
| PUT | `/api/v1/tags/:id` | Update | Admin |
| DELETE | `/api/v1/tags/:id` | Delete | Admin |

### Comments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/comments/article/:id` | Article comments | Public |
| POST | `/api/v1/comments` | Post comment | Required |
| GET | `/api/v1/comments/pending` | Pending queue | Admin |
| PUT | `/api/v1/comments/:id` | Edit comment | Owner |
| DELETE | `/api/v1/comments/:id` | Delete comment | Owner/Admin |
| PATCH | `/api/v1/comments/:id/approve` | Approve | Admin |
| PATCH | `/api/v1/comments/:id/reject` | Reject | Admin |

---

## Response Format

All endpoints return a consistent JSON structure:

```json
// Success
{
  "success": true,
  "message": "Success",
  "data": { }
}

// Paginated
{
  "success": true,
  "message": "Success",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// Error
{
  "success": false,
  "message": "Error description"
}

// Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DB_PATH` | SQLite file path | `./database.sqlite` |
| `JWT_SECRET` | Access token secret | — |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `BCRYPT_ROUNDS` | Password hash rounds | `12` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` |
| `CORS_ORIGIN` | Allowed origins | `*` |

---

## License

ISC © 2024 — Built as a portfolio project demonstrating Node.js REST API best practices.