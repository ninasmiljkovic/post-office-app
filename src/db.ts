import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/post_office";

export const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri, { dbName: "post_office" });
        console.log("MongoDB Connected...");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};
