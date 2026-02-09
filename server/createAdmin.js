import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const createAdmin = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'task_management'
  });

  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    const fullName = 'Admin User';

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await connection.execute(
      `INSERT INTO users (id, email, password, full_name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)`,
      [userId, email, hashedPassword, fullName, now, now]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: admin');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Admin user already exists with this email');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await connection.end();
  }
};

createAdmin();
