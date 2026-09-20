import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "title required"],
    },
    description: {
      type: String,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  },
  { timestamps: true },
);

export const Todo = mongoose.model('Todo', todoSchema);
