const prisma = require("../db/db");
const { getPagination } = require("../utils/pagination");

exports.sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const recieverId = req.params.recieverId;

    if (requesterId === recieverId) {
      return res.status(400).json({
        message: "You cannot send a friend request to yourself.",
      });
    }

    const reciever = await prisma.user.findUnique({
      where: {
        id: recieverId,
      },
    });

    if (!reciever) {
      return res.status(404).json({ message: "User not found."});
    }

    const existingFriendship = await prisma.friendRequest.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            requesterId: requesterId,
            recieverId: recieverId,
          },
          {
            requesterId: recieverId,
            recieverId: requesterId,
          },
        ],
      },
    });

    if (existingFriendship) {
      return res.status(409).json({
        message: "You are already friends with this user.",
      });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          {
            requesterId: requesterId,
            recieverId: recieverId,
          },
          {
            requesterId: recieverId,
            recieverId: requesterId,
          },
        ],
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        message: "A friend request already exists between you and this user.",
      });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        requesterId: requesterId,
        recieverId: recieverId,
        status: "PENDING",
      },
    });

    const notification = await prisma.notification.create({
    data: {
      recieverId : recieverId,
      message: "You have received a new friend request.",
    },
  });

    return res.status(201).json({message: "Friend request sent successfully.",friendRequest,});

  } catch (error) {
    return res.status(500).json({message: "Couldn't send friend request.",error: error.message,});
  }
};

exports.viewFriendRequest = async (req,res) => {
  try {
  const { page, limit, skip } = getPagination(req.query);
  const requestsWhere = {
    where:{
      recieverId: req.user.id,
      status: "PENDING",
    },
  };
  const [requestlist, totalRequests] = await Promise.all([
    prisma.friendRequest.findMany({
      ...requestsWhere,
      include:{
        requester:{
          select:{
             username: true,
             profilePicture : true
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.friendRequest.count(requestsWhere),
  ]);
return res.status(200).json({
  message: "Friend request list fetched successfully",
  requestlist,
  pagination: {
    page,
    limit,
    hasMore: skip + requestlist.length < totalRequests,
    total: totalRequests,
  },
})
}
catch(error) {
  return res.status(500).json({message: "Couldn't fetch friend request list", error: error.message})
}
}

exports.acceptFriendRequest = async (req,res) => {
  try {
      const request = await prisma.friendRequest.findUnique({
      where: {
       id: req.params.requestId,
      },
    });
    if(!request){
        return res.status(404).json({message : "The request doesn't exist."})
    }
    if(request.recieverId  !== req.user.id){
      return res.status(403).json({message: "You are not authorized to accept this request."})
    }
    if (request.status !== "PENDING") {
  return res.status(400).json({ message: "This friend request has already been handled.",});
     }
    const acceptfriendRequest = await prisma.friendRequest.update({
      where:{
        id: req.params.requestId,
      },
      data:{
        status:"ACCEPTED"
      },})

     const notification = await prisma.notification.create({
    data: {
      recieverId : request.requesterId,
      message: "You friend requets was accepted.",
    },
  });
      return res.status(200).json({ message: "Request Accepted successfully.", acceptfriendRequest });
  } catch (error) {
    return res.status(500).json({ message: "Error accepting request.", error: error.message });
  }
};

exports.rejectFriendRequest = async (req,res) => {
  try {
      const request = await prisma.friendRequest.findUnique({
      where: {
       id: req.params.requestId,
      },
    });
    if(!request){
        return res.status(404).json({message : "The request doesn't exist."})
    }
    if(request.recieverId  !== req.user.id){
      return res.status(403).json({message: "You are not authorized to reject this request."})
    }
    if (request.status !== "PENDING") {
  return res.status(400).json({ message: "This friend request has already been handled.",});
     }
    const rejectfriendRequest = await prisma.friendRequest.update({
      where:{
        id: req.params.requestId,
      },
      data:{
        status:"REJECTED"
      },})
      return res.status(200).json({ message: "Request rejected successfully.", rejectfriendRequest });
  } catch (error) {
    return res.status(500).json({ message: "Error rejecting request.", error: error.message });
  }
};

exports.cancelrequest = async (req, res) => {
  try {
      const request = await prisma.friendRequest.findUnique({
      where: {
   id: req.params.requestId,
      },
    });
    if(!request){
        return res.status(404).json({message : "The request doesn't exist."})
    }
    if(req.user.id !== request.requesterId){
      return res.status(403).json({ message: "You are not authorized to cancel this request." });
    }   
      if (request.status !== "PENDING") {
  return res.status(400).json({ message: "This friend request has already been handled.",});
     }
    const cancelledrequest = await prisma.friendRequest.delete({
        where:{
        id: req.params.requestId,
        },
    });
    return res.status(200).json({ message: "request cancelled successfully", cancelledrequest });
  } catch (error) {
    return res.status(500).json({ message: "Error cancelling request", error: error.message });
  }
};

exports.unfriend = async (req, res) => {
  try {
      const request = await prisma.friendRequest.findUnique({
      where: {
       id: req.params.requestId,
      },
    });
    if(!request){
        return res.status(404).json({message : "The request doesn't exist."})
    }
    if(req.user.id !== request.requesterId && req.user.id !== request.recieverId){
      return res.status(403).json({ message: "You are not authorized to cancel this request." });
    }   
      if (request.status !== "ACCEPTED") {
  return res.status(400).json({ message: "You are not friends currently.",});
     }
    const unfriend = await prisma.friendRequest.delete({
        where:{
        id: req.params.requestId,
        },
    });
    return res.status(200).json({ message: "unfriend successfully", unfriend });
  } catch (error) {
    return res.status(500).json({ message: "Couldn't unfriend", error: error.message });
  }
};

exports.getFriendsList = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page, limit, skip } = getPagination(req.query);
    const where = {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { recieverId: userId }],
    };

    const [friends, totalFriends] = await Promise.all([
      prisma.friendRequest.findMany({
        where,
        include: {
          requester: {
            select: { id: true, username: true, profilePicture: true },
          },
          reciever: {
            select: { id: true, username: true, profilePicture: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.friendRequest.count({ where }),
    ]);

    return res.status(200).json({message: "Friends list fetched successfully.",friends,
      pagination: {
        page,
        limit,
        hasMore: skip + friends.length < totalFriends,
        total: totalFriends,
      },
    });
  } catch (error) {
    return res.status(500).json({message: "Couldn't fetch friends list.",error: error.message});
  }}    