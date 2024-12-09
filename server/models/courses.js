const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: String,
  teacher : String,
  students: [String],      // List of selected courses
});

const Courses = mongoose.model("courses", courseSchema,"courses");

module.exports = Courses;
