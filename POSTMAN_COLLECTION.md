# Postman API Collection - Task Management System

Base URL: `http://localhost:5000`

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Task Management](#task-management)
3. [Comments](#comments)
4. [Activities](#activities)
5. [Group Assignments](#group-assignments)
6. [Time Logging](#time-logging)

---

## 🔐 Authentication

### 1. Register New User
**POST** `/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "full_name": "John Doe",
      "role": "employee"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login
**POST** `/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "full_name": "John Doe",
      "role": "employee"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📝 Task Management

### 3. Get All Tasks (with filters & pagination)
**GET** `/api/tasks?page=1&limit=10&status=TODO&priority=HIGH`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): TODO | IN_PROGRESS | REVIEW | DONE
- `priority` (optional): LOW | MEDIUM | HIGH
- `assigned_to` (optional): User ID

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-uuid",
      "title": "Implement authentication",
      "description": "Add JWT-based authentication",
      "status": "TODO",
      "priority": "HIGH",
      "assigned_to": "user-uuid",
      "assigned_to_name": "John Doe",
      "created_by": "admin-uuid",
      "due_date": "2026-02-01T00:00:00.000Z",
      "estimated_hours": 8,
      "created_at": "2026-01-27T10:00:00.000Z",
      "updated_at": "2026-01-27T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### 4. Create Task (Admin Only)
**POST** `/api/tasks`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT-based authentication with bcrypt",
  "priority": "HIGH",
  "assigned_to": "user-uuid",
  "assignees": ["user-uuid-1", "user-uuid-2"],
  "due_date": "2026-02-01T00:00:00.000Z",
  "estimated_hours": 8,
  "created_by": "admin-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "title": "Implement authentication",
    "status": "TODO",
    "created_at": "2026-01-27T10:00:00.000Z"
  }
}
```

---

### 5. Get Task by ID
**GET** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "title": "Implement authentication",
    "description": "Add JWT-based authentication",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "assigned_to": "user-uuid",
    "assigned_to_name": "John Doe",
    "assigned_to_email": "john.doe@company.com",
    "created_by": "admin-uuid",
    "created_by_name": "Admin User",
    "due_date": "2026-02-01T00:00:00.000Z",
    "estimated_hours": 8,
    "is_deleted": false,
    "created_at": "2026-01-27T10:00:00.000Z",
    "updated_at": "2026-01-27T10:00:00.000Z"
  }
}
```

---

### 6. Update Task
**PATCH** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "description": "Updated description",
  "performed_by": "user-uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "task-uuid",
    "status": "IN_PROGRESS",
    "updated_at": "2026-01-27T11:00:00.000Z"
  }
}
```

---

### 7. Delete Task (Admin Only)
**DELETE** `/api/tasks/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

### 8. Get Task Statistics (Admin Only)
**GET** `/api/tasks/stats`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_tasks": 100,
      "todo_tasks": 25,
      "in_progress_tasks": 30,
      "review_tasks": 20,
      "done_tasks": 25,
      "total_employees": 10
    },
    "employees": [
      {
        "employee_id": "user-uuid",
        "employee_name": "John Doe",
        "employee_email": "john.doe@company.com",
        "todo": 5,
        "in_progress": 3,
        "review": 2,
        "done": 10,
        "total": 20
      }
    ]
  }
}
```

---

## 💬 Comments

### 9. Get Task Comments
**GET** `/api/tasks/:taskId/comments`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid",
      "task_id": "task-uuid",
      "comment": "I've started working on this",
      "created_by": "user-uuid",
      "created_by_name": "John Doe",
      "created_by_email": "john.doe@company.com",
      "created_at": "2026-01-27T10:30:00.000Z"
    }
  ]
}
```

---

### 10. Add Comment
**POST** `/api/tasks/:taskId/comments`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "comment": "I've completed the authentication module",
  "created_by": "user-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "task_id": "task-uuid",
    "comment": "I've completed the authentication module",
    "created_at": "2026-01-27T11:00:00.000Z"
  }
}
```

---

## 📊 Activities

### 11. Get Task Activities
**GET** `/api/tasks/:taskId/activities`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity-uuid",
      "task_id": "task-uuid",
      "action": "STATUS_CHANGED",
      "old_value": "TODO",
      "new_value": "IN_PROGRESS",
      "performed_by": "user-uuid",
      "performed_by_name": "John Doe",
      "created_at": "2026-01-27T10:15:00.000Z"
    }
  ]
}
```

---

## 👥 Group Assignments

### 12. Get Task Assignees
**GET** `/api/tasks/:taskId/assignees`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "role": "employee"
    },
    {
      "id": "user-uuid-2",
      "full_name": "Jane Smith",
      "email": "jane.smith@company.com",
      "role": "employee"
    }
  ]
}
```

---

### 13. Add Assignee (Admin Only)
**POST** `/api/tasks/:taskId/assignees`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": "user-uuid-3"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "full_name": "John Doe",
      "email": "john.doe@company.com"
    },
    {
      "id": "user-uuid-3",
      "full_name": "Alice Johnson",
      "email": "alice.johnson@company.com"
    }
  ]
}
```

---

### 14. Remove Assignee (Admin Only)
**DELETE** `/api/tasks/:taskId/assignees/:userId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "full_name": "John Doe",
      "email": "john.doe@company.com"
    }
  ]
}
```

---

### 15. Get My Assigned Tasks
**GET** `/api/tasks/assigned/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "task-uuid",
      "title": "Implement authentication",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "due_date": "2026-02-01T00:00:00.000Z"
    }
  ]
}
```

---

### 16. Get Assignable Users
**GET** `/api/tasks/users/assignable`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "role": "employee"
    }
  ]
}
```

---

## ⏱️ Time Logging

### 17. Create Time Log
**POST** `/api/time-logs`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "task_id": "task-uuid",
  "hours_worked": 4.5,
  "work_date": "2026-01-27",
  "description": "Implemented JWT authentication and tested endpoints",
  "logged_by": "user-uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "timelog-uuid",
    "task_id": "task-uuid",
    "hours_worked": 4.5,
    "work_date": "2026-01-27",
    "created_at": "2026-01-27T17:00:00.000Z"
  }
}
```

---

### 18. Get Time Logs
**GET** `/api/time-logs?start_date=2026-01-01&end_date=2026-01-31`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter to date (YYYY-MM-DD)
- `task_id` (optional): Filter by task
- `user_id` (optional): Filter by user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "timelog-uuid",
      "task_id": "task-uuid",
      "task_title": "Implement authentication",
      "hours_worked": 4.5,
      "work_date": "2026-01-27",
      "description": "Implemented JWT authentication",
      "logged_by": "user-uuid",
      "logged_by_name": "John Doe",
      "created_at": "2026-01-27T17:00:00.000Z"
    }
  ]
}
```

---

## 🔑 JWT Token Usage

After login/register, copy the token from the response and use it in all subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires after 8 hours. You'll need to login again after expiration.

---

## 📌 Quick Import to Postman

1. Open Postman
2. Click "Import" → "Raw text"
3. Create collection named "Task Management System"
4. Set collection variable: `baseUrl` = `http://localhost:5000`
5. Add requests using the endpoints above
6. Set Authorization type to "Bearer Token" for protected routes
7. Use `{{baseUrl}}` in request URLs

---

## 🎯 Testing Workflow

1. **Register** → Get JWT token
2. **Login** (if needed) → Get JWT token
3. **Create Task** → Get task ID
4. **Get All Tasks** → Verify task appears
5. **Update Task** → Change status to IN_PROGRESS
6. **Add Comment** → Add progress update
7. **Add Assignees** → Assign multiple team members
8. **Log Time** → Record hours worked
9. **Get Activities** → View audit trail
10. **Get Stats** → View dashboard analytics

---

## 🚀 Status Workflow

- **TODO** → Employee clicks "Start Work" → **IN_PROGRESS**
- **IN_PROGRESS** → Employee clicks "Submit for Review" → **REVIEW**
- **REVIEW** → Employee/Admin clicks "Mark Done" → **DONE**

Admin can change to any status directly via dropdown.
