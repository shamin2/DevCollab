# DevCollab

DevCollab is a real-time collaboration platform designed for software development teams. It provides lightweight tools that help teams estimate development work and make technical decisions together without requiring user accounts or a complicated setup process.

The application currently includes two main collaboration tools:

- **Planning Poker** — team members privately estimate the complexity of development tasks and reveal their estimates together.
- **Decision Room** — team members privately vote on technical options, provide confidence scores, and optionally explain the reasoning behind their choices.

DevCollab is built as a full-stack TypeScript application using React, Node.js, Express, Socket.IO, and PostgreSQL.

---

## Features

### Planning Poker

Planning Poker allows development teams to collaboratively estimate tasks, user stories, bugs, or other pieces of work.

Users can:

- Create a Planning Poker room
- Join an existing room using a room code
- Join using a display name without creating an account
- View other members currently in the room
- Create estimation rounds
- Submit private estimates
- View real-time voting progress
- Reveal estimates when everyone is ready
- View individual estimates
- Calculate the team's average estimate
- Start additional estimation rounds

The currently supported estimation values are:

```text
0.5, 1, 2, 3, 5, 8, 13, 21, ?
```

`?` represents an unknown estimate or a task that requires additional discussion.

---

### Decision Room

Decision Room provides a structured way for development teams to discuss and vote on technical decisions.

For example:

> Which database should we use for this project?

The host can provide options such as:

- PostgreSQL
- MongoDB
- MySQL

Team members can then:

- Privately select an option
- Provide a confidence score from 1–10
- Optionally explain their reasoning
- View real-time voting progress without exposing votes
- Reveal the results when the team is ready

After revealing the results, DevCollab displays:

- Vote counts
- Vote percentages
- Individual responses
- Confidence scores
- Optional reasoning provided by team members

This allows the team to see not only **what people voted for**, but also **how confident they were and why they made that choice**.

---

## Real-Time Collaboration

DevCollab uses **Socket.IO** to synchronize room activity between connected users.

Real-time events are used for:

- Members joining rooms
- New rounds being created
- Vote progress updates
- Round reveals
- Starting new rounds

Votes themselves remain private until the host reveals the round.

For example, while voting, users may see:

```text
2 / 4 voted
```

but they cannot see which option or estimate another team member selected.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Socket.IO Client
- SCSS Modules

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- PostgreSQL
- `pg`

### Development Tools

- Git
- GitHub
- npm
- VS Code

---

## Architecture

DevCollab follows a client-server architecture with PostgreSQL providing persistent storage and Socket.IO providing real-time communication.

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │                     │
                         │ React + TypeScript  │
                         │   Vite Frontend     │
                         └──────────┬──────────┘
                                    │
                     HTTP / REST    │    WebSocket
                                    │
                         ┌──────────▼──────────┐
                         │      Backend        │
                         │                     │
                         │ Node.js + Express   │
                         │    TypeScript       │
                         │     Socket.IO       │
                         └──────────┬──────────┘
                                    │
                                    │ SQL
                                    │
                         ┌──────────▼──────────┐
                         │     PostgreSQL      │
                         │                     │
                         │ Rooms               │
                         │ Members             │
                         │ Rounds              │
                         │ Options             │
                         │ Votes               │
                         └─────────────────────┘
```

### REST API

The REST API handles persistent application operations such as:

- Creating rooms
- Joining rooms
- Retrieving room information
- Creating rounds
- Submitting votes
- Revealing rounds
- Retrieving results

### Socket.IO

Socket.IO handles real-time communication between users in the same room.

The combination allows PostgreSQL to remain the source of truth while Socket.IO keeps connected clients synchronized.

```text
PostgreSQL
     │
     │ Persistent state
     ▼
Express API
     │
     ├──────────────► React Client
     │
     │ Socket.IO events
     ▼
Other connected clients
```

This is particularly useful when users refresh the application. Persistent room and voting information can be restored from PostgreSQL, while Socket.IO continues providing live updates afterward.

---

## Database Design

DevCollab currently uses five primary database entities:

### Rooms

Stores collaboration rooms and identifies whether a room is being used for Planning Poker or Decision Room.

### Members

Stores the participants who have joined a room.

A member can also be identified as the room host.

### Rounds

Represents an individual Planning Poker estimation or Decision Room vote.

A room can contain multiple rounds.

### Options

Stores available choices for Decision Room rounds.

### Votes

Stores private votes submitted by members.

Depending on the room type, a vote may contain:

- Planning Poker estimate
- Decision option
- Confidence score
- Optional reasoning

A member can submit only one vote for a particular round.

---

## Project Structure

```text
DevCollab/
│
├── frontend/
│   ├── src/
│   │   ├── constants/
│   │   ├── models/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   └── Room/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── socket.ts
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── db.ts
│   │   └── server.ts
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Application Flow

### Creating a Room

```text
User selects collaboration tool
        ↓
User enters display name
        ↓
Frontend sends request to backend
        ↓
Backend creates room
        ↓
Backend creates host member
        ↓
PostgreSQL stores room/member
        ↓
Room code returned to frontend
        ↓
User enters collaboration room
```

### Joining a Room

```text
User enters room code
        ↓
User enters display name
        ↓
Backend validates room
        ↓
Member added to PostgreSQL
        ↓
Socket joins room channel
        ↓
Other members receive update
```

### Voting

```text
Host creates round
        ↓
All clients receive round
        ↓
Members vote privately
        ↓
Votes stored in PostgreSQL
        ↓
Socket.IO broadcasts vote count
        ↓
Host reveals round
        ↓
Results retrieved from backend
        ↓
Results displayed to everyone
```

---

## Running DevCollab Locally

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- PostgreSQL

Clone the repository:

```bash
git clone https://github.com/shamin2/DevCollab.git
cd DevCollab
```

### Backend

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file for your local environment.

Example:

```env
PORT=5001
DATABASE_URL=your_postgresql_connection_string
```

Do **not** commit your real `.env` file or database credentials to GitHub.

Start the development server:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5001
```

### Frontend

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

---

## Environment Variables

Sensitive configuration should be stored using environment variables and should never be committed directly to the repository.

The project `.gitignore` excludes `.env` files.

For production deployment, environment variables will be configured through the selected cloud platform rather than stored directly in the source code.

---

## Security and V1 Scope

DevCollab is currently designed as a lightweight portfolio application rather than a production enterprise collaboration platform.

V1 intentionally does not require account registration.

Users join rooms using:

- Room code
- Display name

This keeps the collaboration workflow fast and simple.

For a production environment, additional security controls would be required, including stronger authentication, authorization, rate limiting, validation, and host permissions.

---

## Future Improvements

DevCollab V1 focuses on the core real-time collaboration experience. Several improvements are planned for future versions.

### AI-Assisted Decision Making

A future version could integrate an LLM API to provide optional assistance during Decision Rooms.

Potential AI features include:

#### AI Option Suggestions

When a host enters a technical question such as:

```text
Which database should we use?
```

DevCollab could suggest relevant options that the host can review and edit before beginning the vote.

#### AI Decision Summary

After results are revealed, AI could analyze:

- Vote distribution
- Confidence scores
- Team reasoning

and generate a concise, neutral summary of the team's discussion and decision factors.

AI would assist the team rather than automatically make the final technical decision.

---

### User Authentication

Future versions could introduce:

- User accounts
- Secure authentication
- Persistent profiles
- Personal room history
- Saved teams

Authentication could also provide stronger host authorization and prevent clients from impersonating another member.

---

### Room History

Users could view previous rounds within the same room, including:

- Previous Planning Poker estimates
- Previous Decision Room votes
- Historical averages
- Decision results
- Team reasoning

---

### Team Workspaces

Teams could create persistent workspaces containing:

- Members
- Projects
- Planning sessions
- Technical decisions
- Historical results

This would expand DevCollab from temporary collaboration rooms into a persistent team collaboration platform.

---

### Improved Host Authorization

The current V1 identifies hosts at the member level.

A future production implementation could introduce stronger server-side authorization to ensure that only authorized hosts can:

- Create rounds
- Reveal votes
- Start new rounds
- Manage room settings

---

### Active Round Constraints

Future database improvements could enforce that only one active voting round exists in a room at a time.

This would provide stronger consistency at the database level.

---

### Mobile and Accessibility Improvements

Additional improvements could include:

- More extensive mobile testing
- Tablet-specific layouts
- Keyboard navigation
- Improved screen-reader support
- Additional accessibility auditing

---

### Notifications and Collaboration Features

Possible future collaboration features include:

- Notifications
- Team chat
- Discussion threads
- Decision comments
- Mentions
- Shareable result summaries

These are intentionally outside the initial V1 scope.

---

## Planned CI/CD

A future development step is to introduce a CI/CD pipeline using **GitHub Actions**.

The planned workflow is:

```text
Developer pushes code
        ↓
GitHub
        ↓
GitHub Actions
        ↓
┌─────────────────────────┐
│ Continuous Integration  │
│                         │
│ Install dependencies    │
│ Build frontend          │
│ Validate backend        │
│ Run automated tests     │
└────────────┬────────────┘
             ↓
        Build succeeds
             ↓
┌─────────────────────────┐
│ Continuous Deployment   │
│                         │
│ Deploy frontend         │
│ Deploy backend          │
└─────────────────────────┘
```

CI/CD details will be updated once the production deployment architecture is finalized.

---

## Planned Cloud Deployment

DevCollab is currently developed and tested locally.

A future deployment will separate the application into three primary components:

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │ React Frontend  │
              └────────┬────────┘
                       │ HTTPS
                       ▼
              ┌─────────────────┐
              │ Express Backend │
              │   + Socket.IO   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

The final cloud provider and services will be documented after deployment is completed.

---

## Design Goals

DevCollab was built around several principles:

**Simple collaboration** — users should be able to create or join a room quickly without creating an account.

**Private voting** — individual decisions remain hidden until the reveal.

**Real-time feedback** — participants immediately see membership and voting progress changes.

**Persistent state** — important application data is stored in PostgreSQL rather than existing only in browser memory.

**Modular architecture** — frontend components, models, services, backend controllers, routes, sockets, and database responsibilities are separated.

**Extensibility** — the architecture allows additional collaboration tools to be introduced later without redesigning the entire application.

---

## Current Status

**DevCollab V1 — Core Development Complete**

Current functionality includes:

- Planning Poker rooms
- Decision Rooms
- Room creation and joining
- Real-time member synchronization
- Private voting
- Real-time voting progress
- Round reveals
- Planning Poker averages
- Decision vote percentages
- Confidence scores
- Optional reasoning
- Multiple rounds
- PostgreSQL persistence
- Refresh state restoration
- Room code sharing

Current next steps:

- Final testing
- Responsive/mobile testing
- CI/CD with GitHub Actions
- Cloud deployment
- Production configuration

---

## Author

**Shamin Yasar**

Computer Science student and software developer.

GitHub: `@shamin2`

---

## License

This project is currently provided as a portfolio and educational project. A formal open-source license may be added in a future version.
