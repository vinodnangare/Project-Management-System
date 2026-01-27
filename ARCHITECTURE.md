# Code Architecture & Design Decisions

This document explains the reasoning behind every major architectural decision in the project. Read this when your senior asks "Why did you implement it this way?"

## Table of Contents
1. [Backend Architecture](#backend-architecture)
2. [Frontend Architecture](#frontend-architecture)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [State Management](#state-management)

---

## Backend Architecture

### Why Layered Architecture?

The backend follows a 3-layer architecture:
```
Controllers → Services → Database
```

**Why this matters:**
- **Separation of Concerns**: Each layer has one responsibility
- **Testability**: Each layer can be tested independently
- **Maintainability**: Changes in one layer don't affect others
- **Reusability**: Services can be used by multiple controllers

**Example:**
```typescript
// Controller (HTTP handling)
export const updateTask = async (req, res) => {
  const validatedData = updateTaskSchema.parse(req.body); // Validate input
  const task = await taskService.updateTask(...);         // Call service
  res.json(task);                                         // Return response
}

// Service (Business logic)
export const updateTask = async (taskId, data, performedBy) => {
  const currentTask = await getTaskById(taskId);          // Fetch current
  trackChange(...);                                       // Log changes
  db.run(UPDATE...);                                      // Update DB
}

// Database (Data persistence)
db.run('UPDATE tasks SET ...');
```

### Why TypeScript?

**Type Safety = Fewer Bugs**
```typescript
// Without TypeScript (JavaScript)
function updateTask(id, data) {
  // What is 'data'? What fields does it have?
  // Did they send a string instead of boolean?
  // No IDE hints, runtime error possible
}

// With TypeScript
interface UpdateTaskRequest {
  title?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

function updateTask(id: string, data: UpdateTaskRequest) {
  // IDE knows exactly what fields are available
  // Compiler catches type mismatches
  // Self-documenting code
}
```

### Why Zod for Validation?

**Runtime Validation Prevents Bad Data**
```typescript
// Without validation
const task = req.body; // Could be anything!
// Title could be: null, undefined, 123, empty string
// Priority could be: 'URGENT', 'super-high', null
// Data integrity violated!

// With Zod validation
const task = taskSchema.parse(req.body);
// If title is missing → ZodError
// If priority is invalid → ZodError
// Only valid data enters the database
```

### Why Service Layer Handles Activity Logging?

**Automatic Audit Trail**
```typescript
// Wrong approach: Add logging in controller
export const updateTask = async (req, res) => {
  const updated = await db.updateTask(id, data);
  await logActivity(...); // Easy to forget
  res.json(updated);
}

// Correct approach: Logging inside service
export const updateTask = async (id, data, performedBy) => {
  const currentTask = await getTask(id);
  
  // Automatically tracks what changed
  if (data.status !== currentTask.status) {
    logActivity({action: 'STATUS_CHANGED', old: ..., new: ...});
  }
  if (data.priority !== currentTask.priority) {
    logActivity({action: 'PRIORITY_CHANGED', old: ..., new: ...});
  }
  
  await db.update(...);
}

// Benefits:
// - Logging never gets forgotten
// - Old and new values tracked automatically
// - Works for all updates (API, CLI, imports, etc.)
// - Single source of truth
```

### Why Soft Deletes?

**Soft delete = Mark as deleted, keep in database**
```typescript
// Hard delete (wrong approach for tasks)
DELETE FROM tasks WHERE id = '123';
// Data is gone forever
// Comments and activities become orphaned
// Can't audit why deletion happened
// Can't recover deleted tasks

// Soft delete (correct approach)
UPDATE tasks SET is_deleted = 1, updated_at = NOW();
// Data is preserved
// References still valid
// Deletion is logged as an activity
// Can be restored if needed
```

---

## Frontend Architecture

### Why Zustand Instead of Redux?

**Redux: Lots of boilerplate for small apps**
```typescript
// Redux requires: action types, actions, reducers, selectors
const TASKS_LOADED = 'TASKS_LOADED';
const TASK_ADDED = 'TASK_ADDED';
// ... 20 more actions

function tasksReducer(state, action) {
  switch(action.type) {
    case TASKS_LOADED:
      return {...state, tasks: action.payload};
    // ... 20 more cases
  }
}
// This file becomes 200 lines just for state!
```

**Zustand: Simple and intuitive**
```typescript
// One file, 50 lines, crystal clear
const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  
  setTasks: (tasks) => set({tasks}),
  addTask: (task) => set((state) => ({
    tasks: [task, ...state.tasks]
  })),
}));

// Usage: const { tasks, setTasks } = useTaskStore();
```

**Why Zustand wins for this project:**
- ✅ 80% less boilerplate
- ✅ Same capabilities as Redux
- ✅ Easier to understand
- ✅ Easier to explain to seniors
- ✅ Great for mid-size apps

### Why Centralized API Client?

**Bad approach: Axios calls scattered everywhere**
```typescript
// TaskList.tsx
const fetchTasks = async () => {
  const res = await axios.get('http://localhost:5000/api/tasks');
  setTasks(res.data.data);
};

// TaskDetail.tsx
const fetchComments = async (id) => {
  const res = await axios.get(`http://localhost:5000/api/tasks/${id}/comments`);
  setComments(res.data.data);
};

// Problems:
// - Base URL duplicated everywhere
// - Error handling inconsistent
// - Hard to add authentication later
// - Need to change 20 files if API URL changes
```

**Good approach: Centralized client**
```typescript
// api/client.ts
class ApiClient {
  private client = axios.create({baseURL: API_BASE_URL});
  
  async getTasks() { return this.client.get('/tasks'); }
  async getTaskComments(id) { return this.client.get(`/tasks/${id}/comments`); }
  async createTask(data) { return this.client.post('/tasks', data); }
}

// Usage everywhere:
const response = await apiClient.getTasks();

// Benefits:
// - One place to change base URL
// - Add interceptors for auth, logging, etc.
// - Consistent error handling
// - Type-safe responses
```

### Why Custom Hooks?

**Hooks encapsulate API logic**
```typescript
// Separates data fetching from UI rendering
// Makes components simpler to understand

// useTasks hook handles:
// - Fetching tasks
// - Loading state
// - Error handling
// - Pagination
// - Filtering

// Component just calls the hook:
function TaskList() {
  const { tasks, loading, error, fetchTasks } = useTasks();
  
  // No API calls, no state management logic here
  // Just rendering and user interaction
  return (
    <>
      {loading && <Loading />}
      {error && <Error />}
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </>
  );
}

// Benefits:
// - Reusable across components
// - Easy to test
// - Clear responsibility
// - Data fetching logic in one place
```

---

## Database Design

### Why These Specific Fields in Tasks Table?

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,              -- UUID for uniqueness
  title TEXT NOT NULL,              -- Required, searchable
  description TEXT,                 -- Optional, for details
  status TEXT NOT NULL,             -- Required, for filtering
  priority TEXT NOT NULL,           -- Required, for sorting
  assigned_to TEXT,                 -- Optional, tracks owner
  created_by TEXT NOT NULL,         -- Required, audit trail
  due_date TEXT,                    -- Optional, deadline
  is_deleted BOOLEAN DEFAULT 0,     -- Soft delete flag
  created_at TEXT NOT NULL,         -- Audit: when created
  updated_at TEXT NOT NULL          -- Audit: when changed
);
```

**Each field serves a purpose:**
- `id` - Unique identifier (won't change, can be primary key)
- `title` - Core requirement, mandatory
- `description` - Details, optional
- `status` - Progress tracking, mandatory
- `priority` - Importance, for sorting/filtering
- `assigned_to` - Work distribution
- `created_by` - Accountability, audit trail
- `due_date` - Deadline management
- `is_deleted` - Soft delete for recovery
- `created_at, updated_at` - Timestamps for sorting and audit

### Why Separate Activity Table?

**Don't store activity in tasks table:**
```sql
-- Bad approach: Activity in same table
CREATE TABLE tasks (
  ...,
  last_action TEXT,           -- Always overwritten!
  last_action_by TEXT,        -- Can't see history
  last_action_time TIMESTAMP
);

-- You lose all history. What changed yesterday?
-- What changed 2 weeks ago? Can't answer!
```

**Separate activity table:**
```sql
-- Good approach: Activity in separate table
CREATE TABLE task_activities (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  action TEXT,               -- CREATED, STATUS_CHANGED, etc.
  old_value TEXT,            -- What was it before?
  new_value TEXT,            -- What is it now?
  performed_by TEXT,         -- Who made the change?
  created_at TEXT            -- When did it happen?
);

-- Now you have complete history:
-- SELECT * FROM task_activities WHERE task_id = '123'
-- See everything that happened, when it happened, who did it
```

### Why Indexes?

**Queries are slow without indexes**
```sql
-- Without index: Scans all 1,000,000 rows!
SELECT * FROM tasks WHERE status = 'TODO';  -- 5 seconds

-- With index: Finds rows in milliseconds!
CREATE INDEX idx_tasks_status ON tasks(status);
SELECT * FROM tasks WHERE status = 'TODO';  -- 50 milliseconds

-- Added indexes for common queries:
-- - idx_tasks_status (filter by status)
-- - idx_tasks_created_by (filter by creator)
-- - idx_task_comments_task_id (find comments)
-- - idx_task_activities_task_id (find activities)
```

---

## API Design

### Why REST Principles?

**RESTful API = Predictable, Standard, Easy to Understand**

```
GET    /tasks              → List all tasks
GET    /tasks/123          → Get specific task
POST   /tasks              → Create new task
PATCH  /tasks/123          → Update task
DELETE /tasks/123          → Delete task

GET    /tasks/123/comments      → Get comments
POST   /tasks/123/comments      → Add comment

GET    /tasks/123/activities    → Get activity log
```

**Why this structure:**
- ✅ Follows HTTP semantics (GET for reading, POST for creating, etc.)
- ✅ Intuitive URL structure (resource/id/sub-resource)
- ✅ Standard conventions (PATCH for partial updates, DELETE for removal)
- ✅ No learning curve (same as other APIs)
- ✅ Self-documenting

### Why Consistent Response Format?

**All responses follow same structure:**
```json
{
  "success": true,
  "data": {...},
  "meta": {...}
}
```

**Benefits:**
- Frontend knows what to expect
- Error responses also consistent
- Easy to write generic error handlers
- API documentation is simpler

### Why Query Parameters vs Body for Filtering?

**Correct approach: Query parameters**
```
GET /tasks?status=TODO&priority=HIGH&assigned_to=user-123

Why:
- GET requests shouldn't have body
- Easy to bookmark/share URLs
- Can be cached by browsers
- RESTful standard
```

**Wrong approach: POST with body**
```
POST /tasks/filter
Body: {status: 'TODO', priority: 'HIGH'}

Problems:
- Not idempotent
- Can't bookmark
- Not cacheable
- Not RESTful
```

### Why Pagination?

**Always paginate large result sets:**
```typescript
// Without pagination
GET /tasks
Response: 100,000 tasks in one response
// Browser hangs, frontend freezes, user frustrated

// With pagination
GET /tasks?page=1&limit=10
Response: 10 tasks + metadata {total: 100000, pages: 10000}
// Fast, efficient, user can browse through pages
```

---

## State Management Pattern

### Flow Diagram

```
React Component
       ↓
Custom Hook (useTasks)
       ↓
API Client (axios)
       ↓
Backend API
       ↓
Database
       ↓ (response)
Zustand Store
       ↓
React Component (re-renders)
```

### Why This Order?

1. **Component** asks for data via hook
2. **Hook** calls API client
3. **API Client** makes HTTP request
4. **Backend** processes request
5. **Database** returns data
6. **API Client** returns response
7. **Hook** updates store
8. **Store** notifies components
9. **Component** re-renders with new data

**Benefits:**
- Data flows in one direction (unidirectional)
- Easy to debug: follow the flow
- Changes in one layer don't cascade unpredictably
- Can add logging/caching at any layer

---

## Error Handling Strategy

### Three-Layer Error Handling

```typescript
// Layer 1: Validation (prevent bad data)
const validatedData = schema.parse(req.body);
// If invalid, throw ZodError immediately

// Layer 2: Service Layer (business logic errors)
const currentTask = await getTaskById(id);
if (!currentTask) throw new Error('Task not found');
// Check business constraints

// Layer 3: Controller (HTTP error responses)
try {
  await service.updateTask(...);
  res.json({success: true});
} catch (error) {
  res.status(error.status || 500).json({
    success: false,
    error: error.message
  });
}
```

### Frontend Error Handling

```typescript
// Hook catches errors and exposes them
const { error, loading } = useTasks();

// Component displays to user
{error && <ErrorBanner message={error} />}

// User sees meaningful message, not "Network Error"
```

---

## Performance Optimizations

### Database Indexes
Prevent slow queries on large datasets

### Pagination
Load only what's needed, not everything

### Soft Deletes
No need to join with separate archive tables

### UUIDs for IDs
Can generate IDs without database, scale horizontally

### State Management
Prevent unnecessary re-renders with Zustand selectors

---

## Testing Implications

This architecture makes testing easier:

```typescript
// Test service independently
describe('taskService', () => {
  it('should update task and log activity', async () => {
    const updated = await updateTask(id, {status: 'DONE'}, 'user-123');
    expect(updated.status).toBe('DONE');
    
    // Verify activity was logged
    const activities = await getActivities(id);
    expect(activities[0].action).toBe('STATUS_CHANGED');
  });
});

// Test controller independently
describe('taskController', () => {
  it('should validate request and return 400 on invalid data', async () => {
    const res = await updateTask({
      title: '', // Invalid: empty required field
    });
    expect(res.status).toBe(400);
  });
});

// Test component independently (no API calls)
describe('TaskList', () => {
  it('should render loading state', () => {
    const { getByText } = render(
      <TaskList tasks={[]} loading={true} />
    );
    expect(getByText('Loading tasks...')).toBeInTheDocument();
  });
});
```

---

## Scalability Considerations

### Can this scale to production?

**Current limitations:**
- SQLite: Single file, not distributed
- No authentication/authorization
- No rate limiting
- No caching

**Easy migrations:**
- SQLite → PostgreSQL (just change db driver)
- Add authentication layer
- Add Redis for caching
- Add API rate limiting middleware
- Add request logging and monitoring

**Architecture supports all these because:**
- Database layer is abstracted
- Services don't know about HTTP
- API client is centralized
- Consistent error handling exists

---

## Code Review Checklist

When reviewing this code, check:

- [ ] Each function does one thing
- [ ] TypeScript types are complete
- [ ] Error cases are handled
- [ ] Comments explain "why", not "what"
- [ ] Variable names are clear
- [ ] No console.logs left
- [ ] Consistent file structure
- [ ] Tests would be easy to write
- [ ] Database queries are indexed
- [ ] Activity logging is automatic

---

**This architecture demonstrates:**
- Professional code organization
- Thoughtful design decisions
- Scalability for growth
- Maintainability for future changes
- Readability for senior code reviews
