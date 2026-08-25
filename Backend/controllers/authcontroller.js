const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const prisma = require("../db/db");
const jwt = require("jsonwebtoken");

exports.PostSignup = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters")
    .matches(/^[a-zA-Z ]+$/)
    .withMessage("Username must contain only alphabets and spaces"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password and confirm password did not  matched");
      }
      return true;
    }),

  body("dateofBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Invalid date of birth"),

body("gender")
  .notEmpty()
  .withMessage("Please select your gender")
  .isIn(["male", "female", "other"])
  .withMessage("Invalid gender selected"),

  async (req, res, next) => {
    console.log(req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, dateofBirth, gender } = req.body;
    const user = await prisma.user.findUnique({ where : {email}, },);
    if (user) {
      return res.status(409).json({ error: "User with this email already exist." });
    }
    
    const hashedPassword = await bcrypt.hash(password,10);
      const newUser = await prisma.user.create({
        data:{
        username,
        email,
        dateofBirth,
        gender,
        password: hashedPassword,
      },});
      return res.status(201).json({message: 'User created sucessfully.', user: newUser})
  }
];

exports.PostLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
  where: {
    email: email,
  },
});
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
};
