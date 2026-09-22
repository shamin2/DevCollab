# 🚀 DevCollab

**DevCollab** is a real-time collaboration platform for development teams, built to make **task estimation and technical decision-making simple, interactive, and transparent**.

Teams can create shared rooms, estimate tasks with Planning Poker, vote on technical decisions, and see results update in real time.

🌐 **Live Application:** https://dqhvj7p6i8eag.cloudfront.net

## ✨ Features

### 🃏 Planning Poker

- Create or join rooms using unique room codes
- Estimate tasks using Planning Poker values
- Keep estimates private until the host reveals them
- Track voting progress in real time
- View individual estimates and the team average
- Start multiple estimation rounds

### 🗳️ Decision Room

- Create technical questions with multiple options
- Cast private votes
- Add confidence scores from **1–10**
- Provide optional reasoning with each vote
- Track voting progress in real time
- Reveal vote percentages and team responses

### ⚡ Real-Time Collaboration

- Live room membership updates
- Real-time voting progress
- Instant round and reveal updates
- Powered by **Socket.IO**

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- SCSS Modules
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- REST APIs

### Database
- PostgreSQL
- Amazon RDS

### Cloud & DevOps
- AWS EC2
- Amazon S3
- Amazon CloudFront
- Nginx
- Docker
- AWS Systems Manager
- GitHub Actions
- GitHub OIDC

## ☁️ Cloud Architecture

```text
                         Users
                           │
              ┌────────────┴────────────┐
              │                         │
            HTTPS                    HTTPS/WSS
              │                         │
              ▼                         ▼
     ┌─────────────────┐       ┌─────────────────┐
     │   CloudFront    │       │   CloudFront    │
     │    Frontend     │       │     Backend     │
     └────────┬────────┘       └────────┬────────┘
              │                         │
              ▼                         ▼
     ┌─────────────────┐       ┌─────────────────┐
     │    Amazon S3    │       │      Nginx      │
     │ React Frontend  │       └────────┬────────┘
     └─────────────────┘                │
                                       ▼
                              ┌─────────────────┐
                              │ Dockerized      │
                              │ Node.js/Express │
                              │ Socket.IO       │
                              │ Amazon EC2      │
                              └────────┬────────┘
                                       │
                                       │ SQL
                                       ▼
                              ┌─────────────────┐
                              │   Amazon RDS    │
                              │   PostgreSQL    │
                              └─────────────────┘
```

The React frontend is hosted in **Amazon S3** and delivered globally through **Amazon CloudFront**. The backend runs as a **Docker container on Amazon EC2** behind **Nginx**, with CloudFront providing HTTPS/WSS access.

Application data is persisted in **PostgreSQL on Amazon RDS**, while **Socket.IO** provides real-time communication between users in shared rooms.

## ⚙️ CI/CD

DevCollab uses **GitHub Actions** for automated frontend and backend deployments.

### Backend Pipeline

```text
Push to main
    ↓
GitHub Actions
    ↓
GitHub OIDC
    ↓
AWS Systems Manager
    ↓
EC2
    ↓
Build Docker Image
    ↓
Deploy Updated Container
```

Backend deployments use **GitHub OIDC** for AWS authentication and **AWS Systems Manager** to deploy without exposing SSH access to GitHub Actions.

### Frontend Pipeline

```text
Push to main
    ↓
GitHub Actions
    ↓
Build React Application
    ↓
Sync Build to Amazon S3
    ↓
Invalidate CloudFront Cache
    ↓
Updated Application Live
```

Changes to the frontend and backend are deployed automatically when their respective source directories are updated on the `main` branch.

## 📂 Project Structure

```text
DevCollab/
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml
│       └── deploy-frontend.yml
│
├── frontend/
│   └── src/
│       ├── constants/
│       ├── models/
│       ├── pages/
│       ├── services/
│       └── styles/
│
├── backend/
│   └── src/
│       ├── constants/
│       ├── controllers/
│       ├── routes/
│       ├── sockets/
│       └── utils/
│
└── README.md
```

## 💻 Running Locally

Clone the repository:

```bash
git clone https://github.com/shamin2/DevCollab.git
cd DevCollab
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

PostgreSQL must be running locally, and the required backend database environment variables must be configured.

## 🔮 Future Improvements

- 🤖 AI-generated Decision Room option suggestions
- 🧠 AI summaries of team decisions and reasoning
- 🔐 User authentication and authorization
- 📜 Room and round history
- 👥 Persistent team workspaces
- 📱 Additional mobile and responsive improvements
- 🧪 Automated unit, integration, and end-to-end testing
- 🌐 Custom domain

## 🚧 Project Status

**DevCollab V1 is deployed and fully functional.**

Planning Poker and Decision Room support real-time multi-user collaboration, persistent PostgreSQL storage, automated cloud deployment, and HTTPS/WSS communication.

## 👨‍💻 Author

**Shamin Yasar**  
Computer Science Student & Software Developer

- **GitHub:** https://github.com/shamin2
- **Portfolio:** https://shamin-portfolio.netlify.app/#home
- **DevCollab:** https://dqhvj7p6i8eag.cloudfront.net
