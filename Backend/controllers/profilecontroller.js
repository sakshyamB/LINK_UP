const prisma = require("../db/db");

exports.Myprofile = async (req, res) => {
  try {
    const ProfileInfo = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        coverPicture: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true,
      },
    });
    return res.status(200).json({ message: "Profile fetched successfully", ProfileInfo });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while fetching the profile",error: error.message,});
  }
};

exports.UserProfile = async (req, res) => {
  try {
    const UserProfileInfo = await prisma.user.findUnique({
      where: {
        id: req.params.id,
      },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        coverPicture: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true,
      },
    });
    if (!UserProfileInfo) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Profile fetched successfully", UserProfileInfo });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while fetching the profile", error: error.message,
      });
  }
};

exports.UpdateProfile = async (req, res) => {
    try{
    const UpdatedProfile = await prisma.user.update({
        where: {
            id: req.user.id,
        },
        data: {
            username: req.body.username,
            profilePicture: req.body.profilePicture,
            coverPicture: req.body.coverPicture,
            dateOfBirth: req.body.dateOfBirth,
            gender: req.body.gender,
        },
    });
    return res.status(200).json({ message: "Profile updated successfully", UpdatedProfile })}
    catch(error){
    return res.status(500).json({ message: "Couldn't Update Profile", error: error.message})
    }};