# 🚀 DevCollab

**DevCollab** is a real-time collaboration platform for development teams. It provides simple tools for teams to **estimate tasks, vote on technical decisions, and collaborate in real time**.

## ✨ Features

### 🃏 Planning Poker
- Create or join a room using a room code
- Estimate tasks using Planning Poker values
- Private voting until estimates are revealed
- Real-time voting progress
- View individual estimates and team average
- Start multiple estimation rounds

### 🗳️ Decision Room
- Create technical questions with multiple options
- Private team voting
- Confidence scores from **1–10**
- Optional reasoning for each vote
- Real-time voting progress
- Reveal vote percentages and team responses

## 🛠️ Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- SCSS Modules

**Backend**
- Node.js
- Express
- TypeScript
- Socket.IO

**Database**
- PostgreSQL

**Tools**
- Git & GitHub
- npm

## 🏗️ Architecture

```text
┌─────────────────────┐
│   React Frontend    │
│    TypeScript       │
└──────────┬──────────┘
           │
     REST + Socket.IO
           │
┌──────────▼──────────┐
│  Node.js / Express  │
│     TypeScript      │
│     Socket.IO       │
└──────────┬──────────┘
           │
           │ SQL
           ▼
┌─────────────────────┐
│     PostgreSQL      │
│                     │
│ Rooms • Members     │
│ Rounds • Votes      │
│ Options             │
└─────────────────────┘
```

PostgreSQL stores persistent application state, while **Socket.IO** provides real-time updates between everyone in a room.

## 📂 Project Structure

```text
DevCollab/
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
│       ├── controllers/
│       ├── routes/
│       ├── sockets/
│       └── utils/
│
└── README.md
```

## 💻 Running Locally

Clone the project:

```bash
git clone https://github.com/shamin2/DevCollab.git
cd DevCollab
```

Install and run the backend:

```bash
cd backend
npm install
npm run dev
```

Then run the frontend:

```bash
cd frontend
npm install
npm run dev
```

> PostgreSQL must be running and the backend database environment variables must be configured.

## 🔮 Future Improvements

- 🤖 AI-generated Decision Room option suggestions
- 🧠 AI summaries of team decisions and reasoning
- 🔐 User authentication and authorization
- 📜 Previous room and round history
- 👥 Persistent team workspaces
- 📱 Additional mobile/responsive improvements
- 🧪 Automated testing
- ⚙️ GitHub Actions CI/CD
- ☁️ Cloud deployment

## 🚧 Project Status

**V1 core development is complete.**

Planning Poker and Decision Room are fully functional with real-time collaboration and PostgreSQL persistence.

Current focus: **CI/CD and cloud deployment**.

## 👨‍💻 Author

**Shamin Yasar**

Computer Science Student & Software Developer

GitHub: **@shamin2**
