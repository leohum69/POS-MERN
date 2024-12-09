const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  age: Number,
  profilePicture: String, // Path to the uploaded picture
  courses: [String],      // List of selected courses
});

const Student = mongoose.model("student", studentSchema,"student");

module.exports = Student;
