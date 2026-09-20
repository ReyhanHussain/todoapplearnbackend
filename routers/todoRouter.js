import { Router } from "express";
import { Todo } from "../models/todos.model.js";
import { User } from "../models/users.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Session } from "../models/Session.model.js";
import authenticate from "../middleware/auth.middleware.js";

const router = Router();



router.get("/todos", authenticate, async (req, res) => {
  try {
    console.log("Logged in user:", req.user);

    const todos = await Todo.find({
      owner: req.user._id,
    });

    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed");
  }
});

//auth router

router.get("/me", authenticate, async (req, res) => {
  try {
    console.log(req.user);
    const { password, __v, createdAt, updatedAt, ...safeObj } =
      req.user.toObject();
    return res.json({ user: safeObj });
  } catch (err) {
    res.status(401).json({});
  }
});

//get a specific id todo
router.get("/todos/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    console.log("geting a specific todo");
    const foundTodos = await Todo.find({
      owner: req.user._id,
      _id: id,
    });
    if (!foundTodos) {
      res.send("no todo exists");
      return;
    }
    res.json(foundTodos);
  } catch (err) {
    console.error("get todo via ID error!! ", err);
    return res.send("failed!!! to get");
  }
});

//add a todo to the db
router.post("/todos", authenticate, async (req, res) => {
  try {
    const todoToAdd = req.body;
    const { title, description, completed } = req.body;
    if (Object.keys(todoToAdd).length == 0 || title.length == 0) {
      return res.send("todo/title is empty");
    }
    const todoObj = new Todo({
      title,
      description,
      completed,
      owner: req.user._id,
    });
    console.log("adding a  todo");
    console.log(await todoObj.save(todoObj));
    res.send("todo added succesfully!! ");
  } catch (err) {
    console.error(" add todo error!! ", err);
    return res.send("failed!!! to add");
  }
});

//deleting a todo
router.delete("/todos/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const todoViaId = await Todo.findOne({
      owner: req.user._id,
      _id: id,
    });

    if (!todoViaId) {
      return res.send("not found!!!");
    }
    console.log("deleting a specific todo");
    await Todo.findByIdAndDelete(id);
    res.send("deletion sucessfull!!");
  } catch (err) {
    console.error("delete todo error!! ", err);
    return res.send("failed!!! to delete");
  }
});

//signup point
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //check for validity

    if (!username || !email || !password) {
      return res.send("all fields required");
    }
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    //check for dupes
    const userDupe = await User.exists({ username: cleanUsername });
    const emailDupe = await User.exists({ email: cleanEmail });

    if (userDupe) {
      return res.send("username already exists FAILED!!!");
    }

    if (emailDupe) {
      return res.send("email already exists FAILED!!!");
    }

    //hash the password here

    const hashedPassword = await bcrypt.hash(password, 10);

    //add the details to db

    const userCreated = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
    });

    console.log("user created @ db: ", userCreated);
    res.send("user created");
  } catch (err) {
    console.error("signup error!! ", err);
    return res.send("failed!!! to signup");
  }
});

//login point
router.post("/login", async (req, res) => {
  try {
    //validate
    const { username: userNameEmail, password } = req.body;
    //check for validity

    if (!userNameEmail || !password) {
      return res.send("all fields required");
    }

    console.log("user", userNameEmail);
    console.log("password", password);

    const cleanedNameEmail = userNameEmail.trim().toLowerCase();

    //check in db

    const userExists = await User.findOne({
      $or: [{ username: cleanedNameEmail }, { email: userNameEmail }],
    });

    if (!userExists) {
      return res.send("user dosent exist!!! signup instead!!");
    }

    //compare pass and give acsess

    const passwordHashed = userExists.password;

    const correctPassword = await bcrypt.compare(password, passwordHashed);

    if (!correctPassword) {
      return res.send("wrong password!!!");
    }
    //here do jwt returj

    const sessionId = crypto.randomBytes(32).toString("hex");
    console.log(sessionId);
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const userId = userExists._id;

    const sessionCreated = await Session.create({
      sessionId,
      expiresAt,
      userId,
    });

    console.log(sessionCreated);

    //attach cookie

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
      secure: false,
      sameSite: "strict",
    });

    //end jwt code

    res.send("passwordMatched");
  } catch (err) {
    console.error("login error!! ", err);
    res.send("login failure!!!");
  }
});

router.post("/logout", async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      await Session.deleteOne({ sessionId });
    }

    res.clearCookie("sessionId", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    return res.send("Logged out successfully");
  } catch (error) {
    console.error("logout error:", err);
    return res.status(500).send("Logout failed");
  }
});

export default router;
