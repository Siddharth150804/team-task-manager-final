# TaskFlow — Team Task Manager

A full-stack web application for team task management with role-based access control (Admin/Member). Built with React, Express.js, and MongoDB.

## 🚀 Live Demo

**Live URL:** _[Add Railway URL after deployment]_

## ✨ Features

- **Authentication** — Secure signup/login with JWT tokens and bcrypt password hashing
- **Project Management** — Create, update, and delete projects
- **Team Management** — Add/remove team members with role assignment
- **Task Management** — Create, assign, update, and delete tasks with status tracking
- **Role-Based Access Control (RBAC)**
  - **Admin**: Full CRUD on projects, tasks, and members
  - **Member**: View projects/tasks, update status on assigned tasks only
- **Dashboard** — Aggregated stats including task counts, status breakdown, priority distribution, and overdue task alerts
- **Task Filtering** — Filter tasks by status and priority
- **Overdue Tracking** — Visual indicators for overdue tasks
- **Responsive Design** — Premium dark theme with glassmorphism UI

## 🛠 Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| **Frontend** | React 18 (Vite), React Router v6    |
| **Styling**  | Vanilla CSS (Dark Theme, Glassmorphism) |
| **Backend**  | Node.js, Express.js                 |
| **Database** | MongoDB Atlas (Mongoose ODM)        |
| **Auth**     | JWT + bcryptjs                      |
| **Deployment** | Railway                           |

## 📁 Project Structure

```
team-task-manager/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── api/            # Axios instance with JWT interceptor
│   │   ├── components/     # Reusable components (Sidebar, Modal, ProtectedRoute)
│   │   ├── context/        # AuthContext (global auth state)
│   │   ├── pages/          # Page components (Login, Register, Dashboard, Projects, ProjectDetail)
│   │   ├── index.css       # Global styles & design system
│   │   ├── App.jsx         # Router setup
│   │   └── main.jsx        # Entry point
│   └── vite.config.js      # Vite config with API proxy
├── server/                 # Express.js backend
│   ├── config/             # Database connection
│   ├── middleware/          # Auth (JWT) & Role-based middleware
│   ├── models/             # Mongoose schemas (User, Project, Task)
│   ├── routes/             # API routes (auth, projects, tasks, dashboard)
│   └── index.js            # Server entry point
├── .env.example            # Environment variable template
├── .gitignore
├── package.json            # Root scripts
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint             | Description          | Access  |
| ------ | -------------------- | -------------------- | ------- |
| POST   | `/api/auth/register` | Register new user    | Public  |
| POST   | `/api/auth/login`    | Login & get token    | Public  |
| GET    | `/api/auth/me`       | Get current user     | Private |

### Projects
| Method | Endpoint                          | Description       | Access       |
| ------ | --------------------------------- | ----------------- | ------------ |
| POST   | `/api/projects`                   | Create project    | Authenticated |
| GET    | `/api/projects`                   | List my projects  | Authenticated |
| GET    | `/api/projects/:id`               | Get project       | Member+      |
| PUT    | `/api/projects/:id`               | Update project    | Admin        |
| DELETE | `/api/projects/:id`               | Delete project    | Admin        |
| POST   | `/api/projects/:id/members`       | Add member        | Admin        |
| DELETE | `/api/projects/:id/members/:uid`  | Remove member     | Admin        |

### Tasks
| Method | Endpoint                                    | Description    | Access       |
| ------ | ------------------------------------------- | -------------- | ------------ |
| POST   | `/api/projects/:pid/tasks`                  | Create task    | Admin        |
| GET    | `/api/projects/:pid/tasks`                  | List tasks     | Member+      |
| GET    | `/api/projects/:pid/tasks/:id`              | Get task       | Member+      |
| PUT    | `/api/projects/:pid/tasks/:id`              | Update task    | Admin (full) / Member (status) |
| DELETE | `/api/projects/:pid/tasks/:id`              | Delete task    | Admin        |

### Dashboard
| Method | Endpoint         | Description         | Access       |
| ------ | ---------------- | ------------------- | ------------ |
| GET    | `/api/dashboard` | Aggregated stats    | Authenticated |

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Set up environment variables
```bash
cp .env.example server/.env
```
Edit `server/.env` with your MongoDB Atlas URI and a JWT secret:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskmanager
JWT_SECRET=your_random_secret_key
PORT=5000
```

### 3. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run locally
**Terminal 1 — Backend:**
```bash
cd server && npm run dev
```
**Terminal 2 — Frontend:**
```bash
cd client && npm run dev
```
Open `http://localhost:5173` in your browser.

## 🚢 Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Connect your GitHub repository
4. Set environment variables in Railway dashboard:
   - `MONGO_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — A random secret key
   - `NODE_ENV` — `production`
   - `PORT` — `5000`
5. Set build command: `cd client && npm install && npm run build && cd ../server && npm install`
6. Set start command: `cd server && node index.js`
7. Deploy!

## 👥 Role-Based Access Control

| Action                    | Admin | Member |
| ------------------------- | ----- | ------ |
| Create/Edit/Delete Project | ✅    | ❌     |
| Add/Remove Members         | ✅    | ❌     |
| Create/Edit/Delete Tasks   | ✅    | ❌     |
| Update Task Status         | ✅    | ✅ (own tasks) |
| View Dashboard             | ✅    | ✅     |
| View Project & Tasks       | ✅    | ✅     |

## 📝 License

MIT
