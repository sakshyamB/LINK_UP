const { body, validationResult } = require("express-validator");
const prisma = require("../db/db");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const uniqueGoogleUsername = async (name, email) => {
  const base = (name || email.split("@")[0])
    .replace(/[^a-zA-Z ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 20) || "Google User";
  let username = base;
  let suffix = 2;

  while (await prisma.user.findUnique({ where: { username } })) {
    const suffixText = ` ${suffix}`;
    username = `${base.slice(0, 20 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return username;
};

exports.PostGoogleAuth = [
  body("idToken")
    .notEmpty()
    .withMessage("Google ID token is required"),

  body("dateofBirth")
    .optional()
    .isISO8601()
    .withMessage("Invalid date of birth"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Others"])
    .withMessage("Invalid gender selected"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { idToken, dateofBirth, gender } = req.body;

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Google authentication is not configured on the server." });
    }

    let googleProfile;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      googleProfile = ticket.getPayload();
      if (!googleProfile?.sub || !googleProfile?.email) {
        return res.status(401).json({ error: "Google did not provide a verified account." });
      }
    } catch (err) {
      console.error("Google token verification failed:", err.message);
      return res.status(401).json({ error: "Google credential could not be verified. Please try again." });
    }

    const { sub: googleId, email, name, picture } = googleProfile;
    try {
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
      });

      if (user) {
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, profilePicture: user.profilePicture || picture },
          });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.status(200).json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
          },
        });
      }

      if (!dateofBirth || !gender) {
        return res.status(202).json({
          requiresProfileCompletion: true,
          message: "Date of birth and gender are required to complete signup.",
          googleData: {
            email,
            name,
            picture,
          },
        });
      }
      
      const newUser = await prisma.user.create({
        data: {
          username: await uniqueGoogleUsername(name, email),
          email,
          googleId,
          profilePicture: picture,
          dateofBirth: new Date(dateofBirth),
          gender,
        },
      });

      const token = jwt.sign(
        { id: newUser.id, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(201).json({
        message: "Account created successfully with Google.",
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          profilePicture: newUser.profilePicture,
        },
      });
    } catch (err) {
      console.error("Google account authentication failed:", err);
      return res.status(500).json({ error: "Google account could not be created or signed in. Please try again." });
    }
  },
];