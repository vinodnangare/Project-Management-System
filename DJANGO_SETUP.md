# Django Backend Setup Guide

This guide explains how to set up Django backend alongside the existing Express backend.

## Current Setup

Your project now supports **two backends running simultaneously**:
- **Express Backend**: `http://localhost:5000/api` (existing)
- **Django Backend**: `http://localhost:8000/api` (new)

## Quick Start Commands

### Run with Express Backend (Default)
```powershell
npm run dev:express
```
This starts both Express server and React client (using port 5000).

### Run with Django Backend
```powershell
npm run dev:django
```
This starts both Django server and React client (using port 8000).

### Run Individual Services
```powershell
# Client with Express
npm run client:express

# Client with Django
npm run client:django

# Express server only
npm run server:express

# Django server only (after setup)
npm run server:django
```

## Django Backend Setup (Step by Step)

### 1. Create Django Project Directory
```powershell
# From project root
mkdir django_server
cd django_server
```

### 2. Create Virtual Environment
```powershell
# Create venv
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1
```

### 3. Install Django Dependencies
```powershell
pip install django djangorestframework django-cors-headers
pip install python-dotenv PyJWT pillow
pip install mysql-connector-python  # or mysqlclient
pip install djangorestframework-simplejwt

# Save dependencies
pip freeze > requirements.txt
```

### 4. Create Django Project
```powershell
# Create project structure
django-admin startproject config .

# Create apps (matching your Express structure)
python manage.py startapp authentication
python manage.py startapp tasks
python manage.py startapp employees
python manage.py startapp timelogs
python manage.py startapp comments
```

### 5. Configure Django Settings

Edit `django_server/config/settings.py`:

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # Your apps
    'authentication',
    'tasks',
    'employees',
    'timelogs',
    'comments',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
]
CORS_ALLOW_CREDENTIALS = True

# Database (use same MySQL database as Express)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'task_management',  # Your DB name
        'USER': 'root',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### 6. Create API URLs

Edit `django_server/config/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/timelogs/', include('timelogs.urls')),
    path('api/comments/', include('comments.urls')),
]
```

### 7. Run Django Server
```powershell
# Make sure venv is activated
.\venv\Scripts\Activate.ps1

# Run migrations (Django will use existing tables)
python manage.py migrate

# Start server
python manage.py runserver 8000
```

## Environment Files

Two environment files control which backend the frontend uses:

### `client/.env.development` (Express - Default)
```env
VITE_API_URL=http://localhost:5000/api
```

### `client/.env.django` (Django)
```env
VITE_API_URL=http://localhost:8000/api
```

## Switching Between Backends

The frontend automatically switches based on which command you run:

```powershell
# Uses Express backend (reads .env.development)
npm run dev:express

# Uses Django backend (reads .env.django)
npm run dev:django
```

## Database Considerations

Both backends can use the **same MySQL database**. Just ensure:
- Django models match your existing table schema
- Use `managed = False` in Django models to prevent Django from modifying tables
- Example:

```python
class Task(models.Model):
    id = models.UUIDField(primary_key=True)
    title = models.CharField(max_length=255)
    # ... other fields
    
    class Meta:
        managed = False  # Don't let Django modify this table
        db_table = 'tasks'
```

## Migration Strategy

1. **Keep Express running** - it's your production backend
2. **Develop Django endpoints** gradually
3. **Test each endpoint** with the same frontend
4. **Switch via npm scripts** to test
5. **Migrate completely** when Django is feature-complete

## Next Steps

1. Install concurrently: `npm install -D concurrently`
2. Set up Django project following steps above
3. Implement authentication endpoints first
4. Test with `npm run dev:django`
5. Gradually add remaining endpoints

## Troubleshooting

### Port Already in Use
```powershell
# Express uses 5000, Django uses 8000
# Make sure ports don't conflict
```

### Database Connection Issues
- Verify MySQL credentials in Django settings
- Ensure database exists
- Check if Express is using the same DB successfully

### CORS Issues
- Ensure `corsheaders` is installed
- Check CORS_ALLOWED_ORIGINS includes your frontend URL
- CorsMiddleware must be first in MIDDLEWARE list

## Useful Commands

```powershell
# Install concurrently (if not installed)
npm install -D concurrently

# Check if Django server is running
curl http://localhost:8000/api/

# Check if Express server is running
curl http://localhost:5000/api/

# View all npm scripts
npm run
```
