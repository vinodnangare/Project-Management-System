import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "./src/models/User.js";

const createAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI!);

    const email = "admin@example.com";
    const password = "admin123";
    const fullName = "Admin User";

    const existing = await UserModel.findOne({ email });

    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      email,
      password: hashedPassword,
      full_name: fullName,
      role: "admin",
      is_active: true
    });

    console.log("✅ Admin created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed:", err);
    process.exit(1);
  }
};

createAdmin();
