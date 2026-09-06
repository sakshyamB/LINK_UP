const prisma = require("../db/db");
const { getPagination } = require("../utils/pagination");

exports.createComment = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: req.params.postId,
      },
    });
    if (!post) {
      return res.status(404).json({ message: "The post doesn't exist." });
    }

    const Addedcomment = await prisma.comment.create({
      data: {
        commentedText: req.body.commentedText,
        postId: req.params.postId,
        commenterId: req.user.id,
      },
    });
      
    if(post.authorId !== req.user.id){
    const notification = await prisma.notification.create({
    data: {
    recieverId : post.authorId,
    message: "Someone commented on your post.",
    },
  });}

   return res.status(201).json({ message: "Comment created successfully", Addedcomment });
  } catch (error) {
   return res.status(500).json({ message: "Error creating comment", error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const commentsWhere = { postId: req.params.postId };
    const [CommentsonPost, totalComments] = await Promise.all([
      prisma.comment.findMany({
        where: commentsWhere,
        include: {
          commenter: {
            select: {
              username: true,
              profilePicture: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where: commentsWhere }),
    ]);
   return res.status(200).json({
     message: "The comments on the post are fetched.",
     CommentsonPost,
     pagination: {
       page,
       limit,
       hasMore: skip + CommentsonPost.length < totalComments,
       total: totalComments,
     },
   });
  } 
  catch (error) {
   return res.status(500).json({message: "Couldn't fetch comments on the post.",error: error.message});
  }
};

exports.updateComment = async (req, res) => {
  try {
      const comment = await prisma.comment.findUnique({
      where: {
   id: req.params.commentId,
      },
    });
    if(!comment){
        return res.status(404).json({message : "The comment doesn't exist."})
    }
    if(req.user.id !== comment.commenterId){
      return res.status(403).json({ message: "You are not authorized to update this comment." });
    }   
    const updatedcomment = await prisma.comment.update({
        where:{
        id: req.params.commentId,
        },
      data: {
        commentedText: req.body.commentedText,
      },
    });
   return res.status(200).json({ message: "Comment updated successfully", updatedcomment });
  } catch (error) {
    return res.status(500).json({ message: "Error updating comment", error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
      const comment = await prisma.comment.findUnique({
      where: {
   id: req.params.commentId,
      },
    });
    if(!comment){
        return res.status(404).json({message : "The comment doesn't exist."})
    }
    if(req.user.id !== comment.commenterId){
      return res.status(403).json({ message: "You are not authorized to delete this comment." });
    }   
    const deletedcomment = await prisma.comment.delete({
        where:{
        id: req.params.commentId,
        },
    });
   return res.status(200).json({ message: "Comment deleted successfully", deletedcomment });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting comment", error: error.message });
  }
};