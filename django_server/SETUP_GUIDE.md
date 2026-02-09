# Django Backend - Complete Setup & API Reference

## ✅ Django Backend is Ready!

Your complete Django backend has been created with all the necessary apps and API endpoints matching your Express backend structure.

---

## 📁 Project Structure

```
django_server/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env                      # Environment configuration
├── config/                   # Django project settings
│   ├── settings.py          # Main settings file
│   ├── urls.py              # Main URL routing
│   ├── asgi.py              # ASGI application
│   └── wsgi.py              # WSGI application
└── apps/
    ├── authentication/      # User authentication & profiles
    ├── tasks/               # Task management
    ├── employees/           # Employee management
    ├── comments/            # Task comments
    └── timelogs/            # Time logging
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```powershell
cd django_server
.\venv\Scripts\Activate.ps1      # Activate virtual environment
pip install -r requirements.txt
```

### Step 2: Update .env File

Edit `django_server\.env` with your database credentials:

```env
DB_NAME=task_management
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

### Step 3: Run Django Server

```powershell
# From django_server directory
python manage.py runserver 8000
```

### Step 4: Switch Frontend to Django

Run from project root:
```powershell
npm run dev:django
```

This will start:
- React frontend (using port 8000 API)
- Django server (port 8000)

---

## 📚 API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/register/` | Register new user | No |
| POST | `/login/` | Login user | No |
| GET | `/profile/` | Get current user profile | Yes |
| PUT | `/profile/update/` | Update user profile | Yes |
| GET | `/users/` | List all active users | Yes |
| GET | `/users/<id>/` | Get specific user | Yes |
| DELETE | `/users/<id>/delete/` | Soft delete user | Yes |

### Tasks (`/api/tasks/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | List all tasks | Yes |
| POST | `/` | Create new task | Yes |
| GET | `/<id>/` | Get task details | Yes |
| PUT | `/<id>/` | Update task | Yes |
| DELETE | `/<id>/` | Delete task (soft) | Yes |
| POST | `/<id>/assign/` | Assign user to task | Yes |
| DELETE | `/<id>/assignees/<assignee_id>/remove/` | Remove assignee | Yes |
| GET | `/my-tasks/` | Get current user's tasks | Yes |

### Employees (`/api/employees/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/` | List all employees | Yes |
| GET | `/<id>/` | Get employee details | Yes |
| PUT | `/<id>/` | Update employee | Yes |
| DELETE | `/<id>/` | Delete employee (soft) | Yes |
| GET | `/stats/` | Get employee statistics | Yes |

### Comments (`/api/comments/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/tasks/<task_id>/` | Get task comments | Yes |
| POST | `/tasks/<task_id>/` | Create comment | Yes |
| GET | `/<id>/` | Get comment details | Yes |
| PUT | `/<id>/` | Update comment | Yes |
| DELETE | `/<id>/` | Delete comment | Yes |

### Time Logs (`/api/timelogs/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/tasks/<task_id>/` | Get task time logs | Yes |
| POST | `/tasks/<task_id>/` | Create time log | Yes |
| GET | `/<id>/` | Get time log details | Yes |
| PUT | `/<id>/` | Update time log | Yes |
| DELETE | `/<id>/` | Delete time log | Yes |
| GET | `/my-timelogs/` | Get current user's time logs | Yes |

---

## 🔑 Authentication

All endpoints (except login/register) require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Login Response Example:
```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "employee",
    "is_active": true
  },
  "refresh": "refresh-token-here",
  "access": "access-token-here"
}
```

---

## 📝 Example Requests

### Register User
```bash
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securepass123",
  "password_confirm": "securepass123",
  "mobile_number": "1234567890"
}
```

### Login
```bash
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

### Create Task
```bash
POST http://localhost:8000/api/tasks/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Build Dashboard",
  "description": "Create admin dashboard",
  "status": "todo",
  "priority": "high",
  "due_date": "2026-02-15T10:00:00Z",
  "estimated_hours": 10
}
```

### Get Current User Profile
```bash
GET http://localhost:8000/api/auth/profile/
Authorization: Bearer <token>
```

---

## 🔧 Common Commands

```powershell
# Activate virtual environment
cd django_server
.\venv\Scripts\Activate.ps1

# Run development server
python manage.py runserver 8000

# Create migrations (if you modify models)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (for admin panel)
python manage.py createsuperuser

# Access admin panel
# http://localhost:8000/admin/

# Deactivate virtual environment
deactivate
```

---

## 🐛 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check DB credentials in `.env`
- Ensure database exists: `task_management`

### Port Already in Use
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Virtual Environment Issues
```powershell
# Remove old venv
rmdir -r venv

# Create new venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Import Errors
- Ensure you're in the `django_server` directory
- Check that virtual environment is activated
- Run: `pip install -r requirements.txt`

---

## 📦 Dependencies Installed

- **Django** - Web framework
- **djangorestframework** - REST API framework
- **django-cors-headers** - CORS support
- **djangorestframework-simplejwt** - JWT authentication
- **mysql-connector-python** - MySQL database driver
- **python-dotenv** - Environment variables
- **Pillow** - Image processing
- **cloudinary** - Image storage
- **bcrypt** - Password hashing

---

## 🔄 Switching Between Backends

### Use Express Backend:
```powershell
npm run dev:express
```

### Use Django Backend:
```powershell
npm run dev:django
```

The frontend automatically switches based on the environment configuration!

---

## 🎯 Next Steps

1. ✅ Django backend created
2. Update `.env` with your database credentials
3. Run: `python manage.py runserver 8000`
4. Test endpoints with Postman or curl
5. Switch frontend: `npm run dev:django`
6. Start building features!

---

## 📖 Key Features

✅ User authentication with JWT  
✅ Task management with multiple assignees  
✅ Employee management  
✅ Task comments  
✅ Time logging  
✅ CORS enabled  
✅ Soft deletes for data integrity  
✅ Automatic timestamps  
✅ Admin panel access  
✅ UUID primary keys  

---

## 🆘 Need Help?

Check these files for detailed implementation:
- [Authentication](apps/authentication/) - User management
- [Tasks](apps/tasks/) - Task CRUD & assignment
- [Comments](apps/comments/) - Task discussions
- [Time Logs](apps/timelogs/) - Time tracking
- [Employees](apps/employees/) - Employee profiles

All files are fully commented and ready to extend!
