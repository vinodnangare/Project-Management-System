# Quick Start Guide - Redux & MySQL Setup

## 🚀 Get Running in 5 Minutes

### Prerequisites Check
- ✅ Node.js 18+ installed: `node --version`
- ✅ MySQL installed and running: `mysql --version`
- ✅ Git cloned or code downloaded

### Step 1: Setup MySQL (2 minutes)

**Open Terminal/Command Prompt:**

```bash
# Login to MySQL
mysql -u root -p
# Enter your MySQL password when prompted
```

**Inside MySQL:**

```sql
CREATE DATABASE task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

Done! The server will create tables automatically.

### Step 2: Setup Backend (2 minutes)

**Open Terminal 1:**

```bash
cd server

# Install dependencies
npm install

# Create .env file with your MySQL password
# On Windows (Command Prompt):
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Edit .env and update DB_PASSWORD if needed
# Then start the server
npm run dev
```

**You should see:**
```
✓ Database connected
✓ Server running on http://localhost:5000
```

### Step 3: Setup Frontend (1 minute)

**Open Terminal 2 (keep Terminal 1 running):**

```bash
cd client

# Install dependencies
npm install

# Create .env file
# On Windows:
copy .env.example .env
# On Mac/Linux:
cp .env.example .env

# Start the frontend
npm run dev
```

**You should see:**
```
VITE v7.2.0 ready in XXX ms
➜ Local: http://localhost:5173/
```

### Step 4: Open Application

Open your browser and go to: **http://localhost:5173**

You should see the Task Management System! 🎉

## ✅ Test the Features

### 1. Create a Task
- Click "+ New Task"
- Fill in: Title (required), Description, Priority
- Click "Create Task"
- Should appear in the list

### 2. View Task Details
- Click on any task in the list
- See full details, comments tab, activity log

### 3. Add a Comment
- Click on task → Comments tab
- Type a comment
- Click "Post Comment"
- Comment appears in the list

### 4. Check Activity Log
- Click on task → Activity tab
- See all changes: who, what, when

### 5. Filter Tasks
- Use status, priority filters (visible in list)
- Tests pagination with 10 items per page

## 🛠 Troubleshooting

### MySQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:**
- Make sure MySQL is running
- Check DB_HOST and DB_PORT in server/.env
- Verify DB_USER and DB_PASSWORD are correct

### Port 5000 Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Kill the process using port 5000
- Or change PORT in server/.env and client/.env

### Redux DevTools Shows Empty State
- Redux is working fine
- State is lazy-loaded (loads after first dispatch)
- Trigger an action (click a task) to see state

### API Requests Failing
- Check browser console (F12 → Console tab)
- Check backend terminal for errors
- Verify VITE_API_URL in client/.env matches backend URL

## 📊 Verify Setup

### Check Backend is Running
```bash
# In new terminal, run:
curl http://localhost:5000/api/tasks
```

Should return JSON response (even if empty).

### Check Frontend is Running
- Open http://localhost:5173 in browser
- Should load without errors
- Check browser console (F12) for errors

### Check Redux
- Install Redux DevTools extension (Chrome/Firefox)
- Open app, should see Redux tab in DevTools
- Perform an action (create task)
- Should see action dispatched in Redux DevTools

## 💾 Database Check

**View data in MySQL:**

```bash
# Login to MySQL
mysql -u root -p

# Use the database
USE task_management;

# Check tables
SHOW TABLES;

# View tasks
SELECT * FROM tasks;

# View comments
SELECT * FROM task_comments;

# View activity log
SELECT * FROM task_activities;

# Exit
exit
```

## 🎯 What to Test First

1. **Create Task** - Tests Redux + MySQL integration
2. **Load Task** - Tests async thunk and data display
3. **View Comments Tab** - Tests multiple slices working together
4. **Add Comment** - Tests nested thunk operations
5. **Check Activity** - Tests activity auto-logging in services

## 📝 Git Status

Check git status to see all changes:
```bash
cd <project-root>
git status
```

You should see:
- Modified: `server/package.json`, `client/package.json`, `README.md`
- Modified: Various `.ts` and `.tsx` files
- New: `.env.example` files, Redux store files

## 🎓 Understanding the Flow

### Creating a Task (Example)

1. **User clicks "Create Task"** → Component shows form
2. **User submits form** → Component dispatches `createTask` thunk
3. **Thunk runs** → Makes POST request to `/api/tasks`
4. **Backend processes** → 
   - Validates with Zod
   - Creates task in MySQL
   - Logs CREATED activity
   - Returns response
5. **Thunk succeeds** → Dispatches fulfilled action
6. **Reducer processes** → Updates Redux state
7. **Component re-renders** → Shows new task in list

All typed and type-safe! ✨

## 🚀 Performance

The application uses:
- **Redux** for efficient state management
- **MySQL connection pooling** for database performance
- **Pagination** to load only 10 tasks at a time
- **Database indexes** on frequently searched columns

Should feel fast and responsive!

## 📚 Read More

- **Full Setup** → [README.md](./README.md)
- **Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Migration Details** → [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)

## ✨ You're All Set!

If you got here without errors, your setup is complete. 

**Next: Open http://localhost:5173 and start using the app!** 🎉

---

**Having issues?** Check the troubleshooting section above or review the full README.md for detailed setup information.
