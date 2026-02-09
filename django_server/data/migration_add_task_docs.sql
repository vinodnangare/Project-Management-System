CREATE TABLE IF NOT EXISTS task_docs (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  content LONGTEXT NULL,
  created_by VARCHAR(36) NOT NULL,
  updated_by VARCHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_task_docs_task_id (task_id),
  INDEX idx_task_docs_updated_at (updated_at)
);
