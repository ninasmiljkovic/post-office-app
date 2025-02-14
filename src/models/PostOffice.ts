import mongoose from "mongoose";

const PostOfficeSchema = new mongoose.Schema({
    zipCode: { type: String, unique: true, required: true, index: true },
});

export const PostOffice = mongoose.model("PostOffice", PostOfficeSchema);
