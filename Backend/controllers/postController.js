const prisma = require("../db/db");

exports.createPost = async (req, res) => {
  try {
    const post = await prisma.post.create({
      data: {
        authorId: req.user.id,
        caption: req.body.caption,
        imageUrl: req.body.imageUrl,
      },
    });
    return res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create post." });
  }
};

exports.getPost = async (req, res) => {
  try {
    const userPost = await prisma.post.findMany({
      where: {
        authorId: req.params.id,
      },
      include: {
      author: {
      select: {
      username: true,
      profilePicture: true,
          },
        },
      },
    });
    return res.status(200).json({ message: "Users Post are fetched successfully", userPost });
  } 
  catch (error) {
    return res.status(500).json({ message: "Couldn't find user's posts", error: error.message });
  }
};

exports.getAllpost = async (req,res)=>{
  try{
    const AllPost = await prisma.post.findMany({
      include: {
      author: {
      select: {
      username: true,
      profilePicture: true,
          },
        },
      },
    orderBy: {
  createdAt: "desc"
}
    })
    return res.status(200).json({message: "All post are fetched.", AllPost})
  }
  catch(error){
    return res.status(500).json({message: "Couldn't fetch all post.", error: error.message})
  }
}