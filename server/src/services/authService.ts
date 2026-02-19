import bcrypt from "bcrypt";
import UserModel from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "employee";
  is_active: boolean;
  created_at: string;
  mobile_number?: string | null;
  profile_image_url?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: "manager" | "employee";
}

export interface LoginRequest {
  email: string;
  password: string;
}

/* ---------------- REGISTER ---------------- */

export const registerEmployee = async (data: RegisterRequest): Promise<User> => {
  const role = String(data.role || "employee").trim().toLowerCase();

  if (!["manager", "employee"].includes(role)) {
    throw new Error(`Invalid role: "${role}"`);
  }

  const existingUser = await UserModel.findOne({ email: data.email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await UserModel.create({
    email: data.email,
    password: hashedPassword,
    full_name: data.full_name,
    role,
  });

  return mapUser(user);
};

/* ---------------- LOGIN ---------------- */

export const login = async (data: LoginRequest): Promise<User> => {
  const user = await UserModel.findOne({ email: data.email, is_active: true }).select("+password");

  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new Error("Invalid email or password");

  return mapUser(user);
};

/* ---------------- DELETE EMPLOYEE ---------------- */

export const deleteEmployee = async (
  employeeIdentifier: string,
  adminId: string
): Promise<void> => {

  const admin = await UserModel.findById(adminId);
  if (!admin || admin.role !== "admin") {
    throw new Error("Only admins can delete employees");
  }

  const user = await UserModel.findOne({
    $or: [
      { _id: mongoose.Types.ObjectId.isValid(employeeIdentifier) ? employeeIdentifier : null },
      { email: employeeIdentifier }
    ]
  });

  if (!user) throw new Error("Employee not found");
  if (user.role === "admin") throw new Error("Cannot delete admin users");

  user.is_active = false;
  await user.save();
};

/* ---------------- UPDATE PROFILE ---------------- */

export const updateUserProfile = async (
  userId: string,
  data: { full_name?: string; mobile_number?: string }
): Promise<User> => {

  if (data.mobile_number) {
    const clean = data.mobile_number.replace(/[-\s]/g, "");
    if (!/^\d{10}$/.test(clean)) {
      throw new Error("Mobile number must be 10 digits");
    }
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      ...(data.full_name !== undefined && { full_name: data.full_name.trim() }),
      ...(data.mobile_number !== undefined && { mobile_number: data.mobile_number || null })
    },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  return mapUser(user);
};

/* ---------------- GET USER ---------------- */

export const getUserById = async (userId: string): Promise<User | null> => {
  const user = await UserModel.findById(userId);
  return user ? mapUser(user) : null;
};

/* ---------------- PROFILE IMAGE ---------------- */

export const updateProfileImage = async (
  userId: string,
  file: Express.Multer.File
): Promise<User> => {

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  // delete old image
  if (user.profile_image_url) {
    try {
      const publicId = user.profile_image_url.split("/").pop()?.split(".")[0];
      if (publicId) await cloudinary.uploader.destroy(`profile_images/${publicId}`);
    } catch {}
  }

  // upload new
  const uploadResult = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "profile_images",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });

  user.profile_image_url = uploadResult.secure_url;
  await user.save();

  return mapUser(user);
};

/* ---------------- HELPER ---------------- */

const mapUser = (user: any): User => ({
  id: user._id.toString(),
  email: user.email,
  full_name: user.full_name,
  role: user.role,
  is_active: user.is_active,
  created_at: user.created_at?.toISOString(),
  mobile_number: user.mobile_number ?? null,
  profile_image_url: user.profile_image_url ?? null,
});
