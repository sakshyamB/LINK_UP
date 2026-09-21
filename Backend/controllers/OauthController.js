const { body, validationResult } = require("express-validator");
const prisma = require("../db/db");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      let user = await prisma.user.findFirst({
        where: {
          OR: [{ googleId }, { email }],
        },
      });

      if (user) {
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatar: user.avatar || picture },
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
            avatar: user.avatar,
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
          username: name,
          email,
          googleId,
          avatar: picture,
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
          avatar: newUser.avatar,
        },
      });
    } catch (err) {
      console.error("Google Auth Error:", err);
      return res.status(401).json({ error: "Invalid or expired Google Token" });
    }
  },
];