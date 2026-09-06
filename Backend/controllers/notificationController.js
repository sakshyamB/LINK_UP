const prisma = require("../db/db");
const { getPagination } = require("../utils/pagination");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { page, limit, skip } = getPagination(req.query);
    const notificationsWhere = { recieverId: userId };
    const [notifications, totalNotifications] = await Promise.all([
      prisma.notification.findMany({
        where: notificationsWhere,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: notificationsWhere }),
    ]);

    return res.status(200).json({
      message: "Notifications fetched successfully.",
      notifications,
      pagination: {
        page,
        limit,
        hasMore: skip + notifications.length < totalNotifications,
        total: totalNotifications,
      },
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