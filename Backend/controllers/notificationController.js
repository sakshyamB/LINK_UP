exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        recieverId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Notifications fetched successfully.",notifications,
    });

  } catch (error) {
    return res.status(500).json({message: "Failed to fetch notifications.",error: error.message,
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.notificationId;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    if (notification.recieverId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this notification.",
      });
    }

    const deletedNotification = await prisma.notification.delete({
      where: { id: notificationId },
    });

    return res.status(200).json({message: "Notification deleted successfully.",notification: deletedNotification,
    });

  } catch (error) {
    return res.status(500).json({message: "Failed to delete notification.",error: error.message,
    });
  }
};