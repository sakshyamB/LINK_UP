const prisma = require("../db/db");

exports.togglelikes = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
     return res.status(404).json({message: "Post not found.",});
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        likedById_postId: {
          likedById: userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      return res.status(200).json({message: "Post unliked successfully.",liked: false,});}

    const like = await prisma.like.create({
      data: {
        likedById: userId,
        postId: postId,
      },
    });

     if (post.authorId !== userId) {
      await prisma.notification.create({
       data: {
      recieverId: post.authorId,
      message: "Someone liked your post.",
    },
  });
}  

    return res.status(201).json({message: "Post liked successfully.",liked: true,like,});
  } catch (error) {
    return res.status(500).json({ message: "Couldn't toggle like.",error: error.message,
    });
  }
};

exports.getlikes = async(req,res) =>{
    try{
    const likesonpost = await prisma.like.findMany({
        where:{
            postId: req.params.postId
        },
        include:{
          likedBy:{
            select:{
            username: true,
            profilePicture: true,
          },
          },
        },
        orderBy:{
            likedAt : "desc"
        }
})
return res.status(200).json({message: "The likes on the post are fetched.", likesonpost })
}
catch (error){
    return res.status(500).json({message: "Error fetching likes.", error: error.message})
}};