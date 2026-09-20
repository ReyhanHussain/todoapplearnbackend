import { Session } from "../models/Session.model.js";
import { User } from "../models/users.model.js";

async function authenticate(req, res, next) {
  try {
    const sessionId = req.cookies.sessionId;
    //validate
    if (!sessionId) {
      return res.status(401).json({message:"please login"});
    }

    const session = await Session.findOne({
      sessionId,
    });
    if (!session) {
      return res.status(401).send("Invalid session");
    }
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({
        _id: session._id,
      });
      return res.status(401).send("session expired relogin");
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).send("User not found");
    }
    req.user = user;

    next();
  } catch (err) {
    console.log("auth error", err);
    res.status(401).send("Aunthentication Failed");
  }
}


export default authenticate;