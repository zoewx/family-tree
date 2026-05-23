# 🌳 Family Tree Application

A full-stack family tree management application with **Angular** frontend and **Spring Boot** backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18, TailwindCSS 3, D3.js |
| Backend | Spring Boot 3, Java 17, Spring Security + JWT |
| Database | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) |
| Deploy | Docker Compose |

## Features

- **Family tree visualization** — D3.js powered interactive tree view
- **Person details** — Click any person to see photo, parents, siblings, children, spouse
- **User auth** — JWT-based registration & login
- **Permission system** — Owner / Admin / Member roles
- **Excel import** — Bulk import family members via `.xlsx`
- **Photo upload** — Cloud storage (MinIO/S3) for person photos
- **Invitation system** — Invite others via link/code
- **Apple-style UI** — Clean, professional design with glass morphism

## Quick Start (Docker)

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Development Setup

### Backend
```bash
# Requires: Java 17+, Maven, PostgreSQL running on localhost:5432
cd backend
mvn spring-boot:run
```

### Frontend
```bash
# Requires: Node.js 18+
cd frontend
npm install --legacy-peer-deps
ng serve
```

Open http://localhost:4200

## Excel Import Format

| Column | Field | Required | Example |
|--------|-------|----------|---------|
| A | row_id | Yes | 1 |
| B | firstName | Yes | John |
| C | lastName | No | Smith |
| D | gender | No | MALE / FEMALE / 男 / 女 |
| E | birthDate | No | 1950-01-15 |
| F | deathDate | No | 2020-12-01 |
| G | bio | No | Family patriarch |
| H | father_row_id | No | 1 (references column A) |
| I | mother_row_id | No | 2 |
| J | spouse_row_id | No | 2 |
| K | generation | No | 0 |

## API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh token

### Family Trees
- `GET /api/trees` — List my trees
- `POST /api/trees` — Create tree
- `GET /api/trees/:id` — Get tree
- `PUT /api/trees/:id` — Update tree
- `DELETE /api/trees/:id` — Delete tree (owner only)
- `POST /api/trees/:id/import` — Import Excel

### Persons
- `GET /api/trees/:id/persons` — List persons
- `POST /api/trees/:id/persons` — Add person
- `GET /api/trees/:id/persons/:pid` — Get person details
- `PUT /api/trees/:id/persons/:pid` — Update person
- `DELETE /api/trees/:id/persons/:pid` — Delete person
- `POST /api/trees/:id/persons/:pid/photo` — Upload photo
- `POST /api/trees/:id/persons/:pid/link` — Link user to person

### Members & Invitations
- `GET /api/trees/:id/members` — List members
- `PUT /api/trees/:id/members/:mid/role` — Change role
- `DELETE /api/trees/:id/members/:mid` — Remove member
- `POST /api/trees/:id/invitations` — Create invitation
- `GET /api/invitations/validate/:code` — Validate invite
- `POST /api/invitations/:code/accept` — Accept invite
