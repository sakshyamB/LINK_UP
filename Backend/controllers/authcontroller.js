const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const { signToken, publicUser } = require("../lib/tokens");

exports.PostSignUp = [
  body("username")
    .notEmpty()
    .withMessage("Username shouldn't be empty.")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username should be between 3 to 20 characters.")
    .matches(/^[a-zA-Z0-9_ ]+$/)
    .withMessage("Username may contain letters, numbers, spaces, and underscores."),
  body("email").notEmpty().withMessage("Email is required.").isEmail().withMessage("Email is invalid."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { username, email, password, phone } = req.body;

    try {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: email.toLowerCase() }, { username }] },
      });
      if (existing) {
        return res.status(409).json({ error: "User with this email or username already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          email: email.toLowerCase(),
          password: hashedPassword,
          phone: phone || null,
        },
      });

      const token = signToken(user);
      return res.status(201).json({
        message: "User created successfully",
        token,
        user: publicUser(user),
      });
    } catch (error) {
      return res.status(500).json({ error: "Couldn't save user." });
    }
  },
];

exports.PostLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email: (email || "").toLowerCase() },
    });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    return res.status(200).json({
      message: "Logged-in successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed." });
  }
};

exports.Me = async (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
};
