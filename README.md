# Digital Museum Browser

Full-stack web application for exploring museums and artifacts with user accounts, comments, and ratings.

## Tech stack
- Backend: Node.js + Express
- Frontend: HTML/CSS/JavaScript (vanilla)
- Database: MySQL

## Project structure
```text
ux-prog/
├── public/
│   ├── index.html
│   ├── museums.html
│   ├── museum.html
│   ├── artifact.html
│   ├── auth.html
│   ├── app.js
│   └── styles.css
├── src/
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── app.js
│   ├── db.js
│   └── server.js
├── schema.sql
├── .env.example
└── package.json
```

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example`.
3. Create DB schema:
   ```bash
   mysql -u root -p < schema.sql
   ```
4. Start app:
   ```bash
   npm run start
   ```

## API endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Museums (CRUD)
- `GET /api/museums`
- `POST /api/museums` (auth)
- `GET /api/museums/:id`
- `PUT /api/museums/:id` (auth)
- `DELETE /api/museums/:id` (auth)

### Artifacts (CRUD)
- `GET /api/artifacts`
- `POST /api/artifacts` (auth)
- `GET /api/artifacts/:id`
- `GET /api/artifacts/:id/similar`
- `PUT /api/artifacts/:id` (auth)
- `DELETE /api/artifacts/:id` (auth)

### Comments & Ratings
- `GET /api/comments/:targetType/:targetId`
- `POST /api/comments` (auth)
- `GET /api/ratings/:targetType/:targetId`
- `POST /api/ratings` (auth)

## Example API usage

Register:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@example.com","password":"Secret123!"}'
```

Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Secret123!"}'
```

Create museum (replace `<TOKEN>`):
```bash
curl -X POST http://localhost:3000/api/museums \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"National Gallery","location":"London, UK","description":"European paintings","image_url":"https://example.com/museum.jpg"}'
```

## Security
- Passwords are hashed with Argon2.
- JWT-based authentication.
- Input validation for IDs, required fields, and ratings.
- Parameterized MySQL queries to reduce SQL injection risk.
