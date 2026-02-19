import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://patiladitya914_db_user:pwblCl7bDf5h1lU7@cluster0.3scoquu.mongodb.net/taskmanager?appName=Cluster0';

// Define User schema inline for this script
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
    is_active: { type: Boolean, default: true },
    mobile_number: { type: String, default: null },
    profile_image_url: { type: String, default: null }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const email = 'admin@example.com';
    const password = 'admin123';
    const fullName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      await mongoose.connection.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      full_name: fullName,
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: admin');
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Admin user already exists with this email');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();
