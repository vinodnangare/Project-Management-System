# Task & Comment Management System

A professional full-stack task management application built with **Node.js/Express**, **React**, **TypeScript**, **MySQL**, and **Redux Toolkit**.

> **Assignment project demonstrating enterprise-grade architecture, clean code principles, and professional development practices.**

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Architecture Decisions](#architecture-decisions)

## ✨ Features

### Core Features (Assignment Requirements)
- ✅ **Task Management**: Create, read, update, and delete tasks with full audit trail
- ✅ **Status Tracking**: TODO → IN_PROGRESS → REVIEW → DONE workflow
- ✅ **Priority Levels**: LOW, MEDIUM, HIGH with visual indicators
- ✅ **Task Assignment**: Assign tasks to team members (with group assignments)
- ✅ **Comments System**: Collaborate with inline task comments
- ✅ **Activity Log**: Complete audit trail with before/after values
- ✅ **Pagination**: Efficient task list handling (10 tasks per page)
- ✅ **Filtering**: Filter by status, priority, and assignee
- ✅ **Soft Deletes**: Deleted tasks preserved for audit purposes
- ✅ **Data Validation**: Zod schemas for all API inputs

### Bonus Features Implemented
- ✅ **Dark Mode**: Professional dark theme UI
- ✅ **Middleware-based Activity Logging**: Automatic activity tracking
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Role-based Access**: Admin and Employee roles with different permissions
- ✅ **Time Tracking**: Log work hours per task
- ✅ **Dashboard Analytics**: Admin stats and employee dashboards
- ✅ **Group Tasks**: Assign multiple employees to a single task

### Technical Features
- **Type-Safe**: Full TypeScript implementation on frontend and backend
- **Redux State Management**: Structured, scalable state with Redux Toolkit
- **Async Thunks**: Clean separation of async logic from reducers
- **MySQL Database**: Enterprise-grade relational database with connection pooling
- **Error Handling**: Comprehensive error handling with meaningful messages
- **CORS Support**: Cross-origin requests properly configured
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠 Tech Stack

### Backend
- **Node.js** 18+ - JavaScript runtime
- **Express.js** 4.18+ - Web framework
- **TypeScript** 5.1+ - Static typing
- **MySQL 2** 3.6+ - Relational database with connection pooling
- **Zod** 3.22+ - Runtime type validation
- **jsonwebtoken** 9.0+ - JWT authentication
- **bcrypt** 6.0+ - Password hashing
- **UUID** 9.0+ - Unique identifier generation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** 18+ - UI library
- **TypeScript** 5.1+ - Static typing
- **Vite** 4+ - Build tool and dev server
- **Redux Toolkit** 1.9+ - State management
- **Axios** 1.4+ - HTTP client
- **CSS3** - Custom styling with CSS variables

### Frontend
- **React** 19.2+ - UI library with hooks
- **TypeScript** 5.9+ - Type safety
- **Vite** 7.2+ - Lightning-fast build tool
- **Redux Toolkit** 1.9+ - Simplified Redux state management
- **React-Redux** 8.1+ - React bindings for Redux
- **Axios** 1.6+ - HTTP client with interceptors
- **CSS3** - Modern styling (no CSS-in-JS dependencies)

## 📁 Project Structure

```
Project Management System/
├── client/                          # Frontend (React + Redux + TypeScript + Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Centralized Axios API client
│   │   ├── components/
│   │   │   ├── TaskList.tsx        # Task list with filtering & pagination
│   │   │   ├── TaskDetail.tsx      # Task details, comments, activity timeline
│   │   │   └── TaskForm.tsx        # Create/edit task form with validation
│   │   ├── hooks/
│   │   │   └── redux.ts            # Pre-typed Redux hooks
│   │   ├── store/
│   │   │   ├── index.ts            # Redux store configuration
│   │   │   ├── thunks.ts           # Redux async thunks for API operations
│   │   │   └── slices/
│   │   │       ├── tasksSlice.ts   # Tasks reducer with thunk handlers
│   │   │       ├── commentsSlice.ts # Comments reducer
│   │   │       ├── activitiesSlice.ts # Activities reducer
│   │   │       └── uiSlice.ts      # UI state management
│   │   ├── styles/
│   │   │   ├── TaskList.css
│   │   │   ├── TaskDetail.css
│   │   │   ├── TaskForm.css
│   │   │   └── App.css
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # React entry with Redux Provider
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── server/                          # Backend (Node.js + Express + TypeScript + MySQL)
    ├── src/
    │   ├── config/
    │   │   └── database.ts          # MySQL connection pool & initialization
    │   ├── controllers/
    │   │   └── taskController.ts    # HTTP request handlers
    │   ├── middleware/
    │   │   └── errorHandler.ts      # Error handling & logging
    │   ├── routes/
    │   │   └── taskRoutes.ts        # RESTful API route definitions
    │   ├── services/
    │   │   └── taskService.ts       # Business logic & activity logging
    │   ├── types/
    │   │   └── index.ts             # TypeScript interfaces & enums
    │   ├── validators/
    │   │   └── task.ts              # Zod validation schemas
    │   └── index.ts                 # Express app setup
    ├── .env.example
    └── package.json
```

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** 18 or higher
- **npm** or yarn
- **MySQL** 5.7 or higher (local or remote instance)
- **Git**

### Step 1: Create MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit MySQL
exit
```

The server will automatically create all required tables and indexes on first run.

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 3: Configure Environment Variables

**Server Configuration (server/.env)**

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your MySQL credentials
```

Content of `server/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=task_management

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Client Configuration (client/.env)**

```bash
# Copy the example file
cp .env.example .env
```

Content of `client/.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Development Servers

**Terminal 1 - Backend Server:**

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
# API available at http://localhost:5000/api
```

**Terminal 2 - Frontend Server:**

```bash
cd client
npm run dev
# Application opens at http://localhost:5173
```

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:5173**

The application should now be fully functional with:
- Task list with filtering and pagination
- Task creation and updates
- Comments on tasks
- Activity/audit log for all changes

## 🗄 Database Configuration

### MySQL Schema

The system automatically creates 3 tables:

**1. tasks** - Main task table
```sql
- id (VARCHAR 36, PRIMARY KEY)
- title (VARCHAR 255, NOT NULL)
- description (TEXT)
- status (ENUM: TODO, IN_PROGRESS, REVIEW, DONE)
- priority (ENUM: LOW, MEDIUM, HIGH)
- assigned_to (VARCHAR 100)
- created_by (VARCHAR 100, NOT NULL)
- created_at (DATETIME)
- updated_at (DATETIME)
- is_deleted (BOOLEAN, soft delete flag)

Indexes: status, priority, assigned_to, created_by, created_at
```

**2. task_comments** - Comment system
```sql
- id (VARCHAR 36, PRIMARY KEY)
- task_id (VARCHAR 36, FOREIGN KEY → tasks.id CASCADE)
- comment (TEXT, NOT NULL)
- created_by (VARCHAR 100, NOT NULL)
- created_at (DATETIME)
- is_deleted (BOOLEAN)

Indexes: task_id, created_at
```

**3. task_activities** - Audit trail
```sql
- id (VARCHAR 36, PRIMARY KEY)
- task_id (VARCHAR 36, FOREIGN KEY → tasks.id CASCADE)
- action (VARCHAR 50: CREATED, STATUS_CHANGED, ASSIGNED, etc.)
- performed_by (VARCHAR 100, NOT NULL)
- old_value (VARCHAR 255)
- new_value (VARCHAR 255)
- created_at (DATETIME)

Indexes: task_id, action, created_at
```

### Why MySQL?

- **Scalability**: Connection pooling handles concurrent requests efficiently
- **Reliability**: ACID transactions ensure data consistency
- **Performance**: Proper indexes on frequently queried columns
- **Production-Ready**: Industry standard for enterprise applications
- **Data Integrity**: Foreign keys and constraints prevent corruption
- **Audit Trail**: Soft deletes preserve all historical data

### Database Connection Pool

The server uses MySQL connection pooling (10 maximum connections) for:
- Better resource utilization
- Improved performance
- Support for concurrent requests
- Reduced connection overhead

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Tasks Endpoints

#### Get All Tasks
```http
GET /tasks?page=1&limit=10&status=TODO&priority=HIGH&assigned_to=user123
```

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter: TODO, IN_PROGRESS, REVIEW, DONE
- `priority` - Filter: LOW, MEDIUM, HIGH
- `assigned_to` - Filter by user ID

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Fix login bug",
      "description": "Users unable to login",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "assigned_to": "user123",
      "created_by": "user456",
      "due_date": "2024-01-20T00:00:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Get Task by ID
```http
GET /tasks/:id
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users unable to login with OAuth",
  "priority": "HIGH",
  "assigned_to": "user123",
  "due_date": "2024-01-20T23:59:59Z",
  "created_by": "user456"
}
```

#### Update Task
```http
PATCH /tasks/:id
Content-Type: application/json

{
  "status": "REVIEW",
  "priority": "MEDIUM"
}
```

Supported fields: `title`, `description`, `status`, `priority`, `assigned_to`, `due_date`

#### Delete Task (Soft Delete)
```http
DELETE /tasks/:id
```

### Comments Endpoints

#### Get Comments
```http
GET /tasks/:id/comments
```

#### Add Comment
```http
POST /tasks/:id/comments
Content-Type: application/json

{
  "comment": "I've started working on this",
  "created_by": "user123"
}
```

### Activity Endpoints

#### Get Activity Log
```http
GET /tasks/:id/activities
```

Returns all changes with: action, performed_by, old_value, new_value, created_at

### Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

HTTP Status Codes:
- `400` - Validation error
- `404` - Resource not found
- `500` - Server error

## 🔄 State Management with Redux

### Why Redux Toolkit?

1. **Structured State**: Single source of truth
2. **Predictable**: Pure reducers, deterministic state changes
3. **Debuggable**: Redux DevTools for time-travel debugging
4. **Scalable**: Handles complex state as app grows
5. **Less Boilerplate**: Redux Toolkit reduces code significantly

### Store Structure

```typescript
{
  tasks: {
    items: Task[],
    selectedTaskId: string | null,
    loading: boolean,
    error: string | null,
    pagination: { total, page, limit, pages },
    filters: { status?, priority?, assigned_to? }
  },
  comments: {
    items: TaskComment[],
    loading: boolean,
    error: string | null
  },
  activities: {
    items: TaskActivity[],
    loading: boolean,
    error: string | null
  },
  ui: {
    selectedTaskId: string | null,
    showTaskForm: boolean,
    showDeleteConfirm: boolean,
    deleteTargetId: string | null
  }
}
```

### Using Redux in Components

```typescript
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchTasks, createTask } from '../store/thunks';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(state => state.tasks);

  useEffect(() => {
    dispatch(fetchTasks({ page: 1, limit: 10 }));
  }, [dispatch]);

  return (
    // Use items, loading, error in JSX
  );
}
```

### Async Thunks

All API operations are async thunks:

```typescript
dispatch(fetchTasks({ page: 1, limit: 10 }))
dispatch(fetchTaskById(taskId))
dispatch(createTask(taskData))
dispatch(updateTask({ taskId, updates, performedBy }))
dispatch(deleteTask({ taskId, performedBy }))
dispatch(fetchComments(taskId))
dispatch(addTaskComment({ taskId, comment, createdBy }))
dispatch(fetchActivities(taskId))
```

Each thunk automatically handles:
- Loading state (pending)
- Success state (fulfilled)
- Error state (rejected)

## 🏗 Architecture Decisions

### Separation of Concerns

**Backend Layers:**
- **Controllers**: HTTP request/response handling
- **Services**: Business logic and data operations
- **Database**: Query execution via executeQuery helper
- **Validators**: Zod schemas at API boundaries
- **Middleware**: Logging, error handling

**Frontend Layers:**
- **Components**: UI rendering
- **Redux**: Global state management
- **Thunks**: API integration
- **Hooks**: Pre-typed Redux hooks
- **Styles**: Component-specific CSS

### Activity Logging

Every task change is automatically logged:
- **Who**: performed_by field
- **What**: action field (CREATED, STATUS_CHANGED, etc.)
- **Before**: old_value field
- **After**: new_value field
- **When**: created_at field

This happens at the service layer, ensuring consistency.

### Soft Deletes

Tasks are marked deleted (`is_deleted = 1`) instead of removed:
- Data recovery possible
- Audit trail preserved
- Referential integrity maintained
- Complies with data retention policies

### Type Safety

- **TypeScript** on both frontend and backend
- **Zod** validation at API boundaries
- **Redux** with full type inference
- Prevents runtime errors at compile time

## 🚢 Production Build

### Build Frontend
```bash
cd client
npm run build
# Creates optimized production build in dist/
```

### Build Backend
```bash
cd server
npm run build
# Creates optimized build in dist/
```

### Environment for Production

Update `.env` files with production values:
- Use production MySQL database
- Set `NODE_ENV=production`
- Use secure CORS_ORIGIN
- Enable HTTPS

### Deployment Tips

- Use process manager (PM2) for Node.js
- Set up database backups
- Use reverse proxy (Nginx)
- Enable HTTPS/SSL certificates
- Monitor application logs
- Set up error tracking

## 📚 Additional Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep dive into design decisions
- **[INTERVIEW_GUIDE.md](./INTERVIEW_GUIDE.md)** - How to explain this project to seniors
- **[COMMIT_STRATEGY.md](./COMMIT_STRATEGY.md)** - Git workflow and commit patterns

## 🔧 Development Tips

### Backend Development
- Use REST client (Postman, Thunder Client) for API testing
- Server auto-restarts on file changes with `npm run dev`
- Check console for SQL queries
- Use MySQL Workbench or DBeaver for database inspection

### Frontend Development
- Use Redux DevTools browser extension
- React DevTools for component inspection
- Component hot reloading with Vite
- TypeScript error checking on save

## 🎯 Project Highlights

### Professional Code Quality
- Consistent naming conventions
- Clear separation of concerns
- Comprehensive error handling
- Well-organized folder structure
- Type safety throughout

### Scalable Architecture
- Easy to add new features
- Business logic in service layer
- Reusable Redux slices
- Component composition
- API abstraction layer

### Enterprise Features
- Activity audit trail
- Data validation at boundaries
- Soft deletes for data safety
- Connection pooling for performance
- CORS for frontend integration

## 📄 License

ISC

---

**Built with ❤️ demonstrating full-stack development excellence** 🚀
