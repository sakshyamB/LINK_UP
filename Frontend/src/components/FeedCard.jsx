import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaRegComment,
  FaPaperPlane,
  FaEdit,
  FaTrash,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import PostSuccessPopup from "./PostSuccessPopup";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

const FeedCard = ({
  post,
  currentUser: userProp,
  onPostDeleted,
  onPostUpdated,
}) => {
  const currentUser =
    userProp || JSON.parse(localStorage.getItem("user") || "null");
  const [isLiked, setIsLiked] = useState(
    Boolean(post?.isLikedByMe ?? post?.isLiked ?? false),
  );
  const [likeCount, setLikeCount] = useState(
    post?.likeCount ?? post?._count?.likes ?? 0,
  );
  const [likedUsers, setLikedUsers] = useState([]);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [commentCount, setCommentCount] = useState(
    post?.commentCount ?? post?._count?.comments ?? post?.comments?.length ?? 0,
  );
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsNextPage, setCommentsNextPage] = useState(2);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [savingLike, setSavingLike] = useState(false);
  const [interactionError, setInteractionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteSuccessPending, setDeleteSuccessPending] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postDraft, setPostDraft] = useState(
    post?.content || post?.caption || "",
  );
  const [editingImagePreview, setEditingImagePreview] = useState(
    post?.image || post?.imageUrl || null,
  );
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentDeletingId, setCommentDeletingId] = useState(null);
  const [commentDeleteConfirmId, setCommentDeleteConfirmId] = useState(null);
  const [commentSavingId, setCommentSavingId] = useState(null);
  const isOwner = Boolean(
    currentUser?.id && post?.author?.id && currentUser.id === post.author.id,
  );

  useEffect(() => {
    setIsLiked(Boolean(post?.isLikedByMe ?? post?.isLiked ?? false));
    setLikeCount(post?.likeCount ?? post?._count?.likes ?? 0);
    setPostDraft(post?.content || post?.caption || "");
  }, [post]);

  useEffect(() => {
    if (!showComments || !post?.id) return undefined;
    let active = true;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/comment/get/${encodeURIComponent(post.id)}?page=1&limit=10`,
          getAuthConfig(),
        );
        if (!active) return;
        const loaded = (response.data.CommentsonPost || []).map((comment) => ({
          id: comment.id,
          user: comment.commenter?.username || "User",
          avatar: comment.commenter?.profilePicture,
          text: comment.commentedText,
          createdAt: comment.createdAt
            ? new Date(comment.createdAt).toLocaleString()
            : "",
          commenterId: comment.commenterId,
        }));
        setComments(loaded);
        setCommentCount(response.data.pagination?.total ?? loaded.length);
        setCommentsHasMore(Boolean(response.data.pagination?.hasMore));
        setCommentsNextPage(2);
      } catch (error) {
        if (active)
          setInteractionError(
            error.response?.data?.message || "Unable to load comments.",
          );
      } finally {
        if (active) setCommentsLoading(false);
      }
    };

    fetchComments();
    return () => {
      active = false;
    };
  }, [showComments, post?.id]);

  const handleLoadMoreComments = async () => {
    if (!post?.id || loadingMoreComments || !commentsHasMore) return;
    setLoadingMoreComments(true);
    setInteractionError("");
    try {
      const response = await axios.get(
        `${API_URL}/comment/get/${encodeURIComponent(post.id)}?page=${commentsNextPage}&limit=10`,
        getAuthConfig(),
      );
      const loaded = (response.data.CommentsonPost || []).map((comment) => ({
        id: comment.id,
        user: comment.commenter?.username || "User",
        avatar: comment.commenter?.profilePicture,
        text: comment.commentedText,
        createdAt: comment.createdAt
          ? new Date(comment.createdAt).toLocaleString()
          : "",
        commenterId: comment.commenterId,
      }));
      setComments((existing) => {
        const existingIds = new Set(existing.map((comment) => comment.id));
        return [
          ...existing,
          ...loaded.filter((comment) => !existingIds.has(comment.id)),
        ];
      });
      setCommentCount(response.data.pagination?.total ?? commentCount);
      setCommentsHasMore(Boolean(response.data.pagination?.hasMore));
      setCommentsNextPage((page) => page + 1);
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to load more comments.",
      );
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
    );
    if (response.status !== 200) {
      throw new Error("Failed to upload image to Cloudinary.");
    }

    return response.data.secure_url;
  };

  const loadLikedUsers = async () => {
    if (!post?.id) return;
    try {
      const response = await axios.get(
        `${API_URL}/like/get/${encodeURIComponent(post.id)}`,
        getAuthConfig(),
      );
      const users = (response.data.likesonpost || []).map((like) => ({
        id: like.likedBy?.id || like.likedById,
        username: like.likedBy?.username || "User",
        profilePicture: like.likedBy?.profilePicture,
      }));
      setLikedUsers(users);
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to load likes.",
      );
    }
  };

  const handleLike = async () => {
    if (!post?.id || savingLike) return;
    setSavingLike(true);
    setInteractionError("");
    try {
      const response = await axios.post(
        `${API_URL}/like/toggle/${encodeURIComponent(post.id)}`,
        {},
        getAuthConfig(),
      );
      const liked = Boolean(response.data.liked);
      setIsLiked(liked);
      setLikeCount((count) => Math.max(0, count + (liked ? 1 : -1)));
      if (showLikes) {
        await loadLikedUsers();
      }
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to update like.",
      );
    } finally {
      setSavingLike(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !post?.id) return;
    setInteractionError("");
    try {
      const response = await axios.post(
        `${API_URL}/comment/create/${encodeURIComponent(post.id)}`,
        { commentedText: text },
        getAuthConfig(),
      );
      const created = response.data.Addedcomment;
      setComments((existing) => [
        {
          id: created.id,
          user: currentUser?.username || "You",
          avatar: currentUser?.profilePicture || currentUser?.avatar,
          text: created.commentedText,
          createdAt: "Just now",
          commenterId: currentUser?.id,
        },
        ...existing,
      ]);
      setCommentCount((count) => count + 1);
      setCommentText("");
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to add comment.",
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentDeletingId(commentId);
    try {
      await axios.delete(
        `${API_URL}/comment/delete/${encodeURIComponent(commentId)}`,
        getAuthConfig(),
      );
      setComments((existing) =>
        existing.filter((comment) => comment.id !== commentId),
      );
      setCommentCount((count) => Math.max(0, count - 1));
      setCommentDeleteConfirmId(null);
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to delete comment.",
      );
    } finally {
      setCommentDeletingId(null);
    }
  };

  const handleSaveComment = async (commentId) => {
    const text = editingCommentText.trim();
    if (!text) return;
    setCommentSavingId(commentId);
    try {
      const response = await axios.put(
        `${API_URL}/comment/update/${encodeURIComponent(commentId)}`,
        { commentedText: text },
        getAuthConfig(),
      );
      const updatedText = response.data.updatedcomment?.commentedText || text;
      setComments((existing) =>
        existing.map((comment) =>
          comment.id === commentId
            ? { ...comment, text: updatedText }
            : comment,
        ),
      );
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to update comment.",
      );
    } finally {
      setCommentSavingId(null);
    }
  };

  const handleDeletePost = async () => {
    if (!post?.id) return;
    try {
      await axios.delete(
        `${API_URL}/post/delete/${encodeURIComponent(post.id)}`,
        getAuthConfig(),
      );
      setIsDeleted(true);
      setDeleteSuccessPending(true);
      setSuccessMessage("Post deleted successfully.");
    } catch (error) {
      setInteractionError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Unable to delete post.",
      );
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleSavePost = async () => {
    if (!post?.id) return;
    const text = postDraft.trim();
    if (!text) {
      setInteractionError("Post caption cannot be empty.");
      return;
    }
    setSavingPost(true);
    try {
      const response = await axios.put(
        `${API_URL}/post/update/${encodeURIComponent(post.id)}`,
        { caption: text, imageUrl: editingImagePreview || null },
        getAuthConfig(),
      );
      const updated = response.data.updatedPost;
      const nextImageUrl = updated.imageUrl || editingImagePreview || null;
      onPostUpdated?.({
        ...post,
        content: updated.caption || text,
        caption: updated.caption || text,
        image: nextImageUrl,
        imageUrl: nextImageUrl,
      });
      setEditingPost(false);
      setInteractionError("");
      setEditingImagePreview(nextImageUrl);
      setSuccessMessage("Post updated successfully.");
    } catch (error) {
      setInteractionError(
        error.response?.data?.message || "Unable to update post.",
      );
    } finally {
      setSavingPost(false);
    }
  };

  const handleEditImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingEditImage(true);
      const uploadedImage = await uploadImageToCloudinary(file);
      setEditingImagePreview(uploadedImage);
      setInteractionError("");
    } catch (error) {
      setInteractionError(
        error.response?.data?.message ||
          error.message ||
          "Unable to upload image.",
      );
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const toggleComments = () => {
    setInteractionError("");
    setShowComments((shown) => !shown);
  };

  const handleSuccessPopupClose = () => {
    setSuccessMessage("");
    if (deleteSuccessPending) {
      setDeleteSuccessPending(false);
      onPostDeleted?.(post.id);
    }
  };

  if (isDeleted) {
    return successMessage ? (
      <PostSuccessPopup
        message={successMessage}
        onClose={handleSuccessPopupClose}
      />
    ) : null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center space-x-3">
          <Link
            to={post?.author?.id ? `/profile/${post.author.id}` : "/profile"}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm ring-2 ring-indigo-50 overflow-hidden">
              {post?.author?.profilePicture || post?.author?.avatar ? (
                <img
                  src={post.author.profilePicture || post.author.avatar}
                  alt={post.author.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                post?.author?.username?.charAt(0).toUpperCase() || "U"
              )}
            </div>
          </Link>
          <div>
            <Link
              to={post?.author?.id ? `/profile/${post.author.id}` : "/profile"}
              className="font-bold text-sm text-slate-800 hover:text-indigo-600 transition"
            >
              {post?.author?.username || "User Name"}
            </Link>
            <p className="text-xs text-slate-400">
              {post?.createdAt || "2 hours ago"}
            </p>
          </div>
        </div>

        {isOwner && !editingPost && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingPost(true)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
              aria-label="Edit post"
            >
              <FaEdit className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="Delete post"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p className="font-medium">Delete this post?</p>
            <p className="mt-1 text-xs text-rose-600">
              This action cannot be undone.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPost ? (
        <div className="px-4 pb-4">
          <textarea
            value={postDraft}
            onChange={(e) => setPostDraft(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 text-xs font-medium text-slate-600">
              <FaImage />
              <span>
                {isUploadingEditImage ? "Uploading..." : "Change post image"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditImageChange}
                className="hidden"
                disabled={isUploadingEditImage}
              />
            </label>

            {editingImagePreview && (
              <img
                src={editingImagePreview}
                alt="Post preview"
                className="mt-3 max-h-64 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingPost(false);
                setShowDeleteConfirm(false);
                setPostDraft(post?.content || post?.caption || "");
                setEditingImagePreview(post?.image || post?.imageUrl || null);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePost}
              disabled={savingPost || isUploadingEditImage}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {savingPost ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {(post?.content || post?.caption) && (
            <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {post.content || post.caption}
            </p>
          )}

          {(post?.image || post?.imageUrl) && (
            <div className="w-full bg-slate-100 max-h-[480px] overflow-hidden flex items-center justify-center">
              <img
                src={post.image || post.imageUrl}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500">
        <button
          type="button"
          onClick={async () => {
            await loadLikedUsers();
            setShowLikes((value) => !value);
          }}
          className="flex items-center gap-1.5 hover:text-indigo-600 hover:underline"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] text-white">
            <FaHeart />
          </span>
          <span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </span>
        </button>
        <button
          type="button"
          onClick={toggleComments}
          className="hover:underline text-slate-500"
        >
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
        <button
          type="button"
          onClick={handleLike}
          disabled={savingLike}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold transition ${isLiked ? "text-rose-500 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"} `}
        >
          {isLiked ? (
            <FaHeart className="text-rose-500 text-base" />
          ) : (
            <FaRegHeart className="text-base" />
          )}
          <span>Like</span>
        </button>

        <button
          type="button"
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
        >
          <FaRegComment className="text-base text-slate-400" />
          <span>Comment</span>
        </button>
      </div>

      {showLikes && (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Liked by</h4>
            <button
              type="button"
              onClick={() => setShowLikes(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <FaTimes className="text-xs" />
            </button>
          </div>
          {likedUsers.length === 0 ? (
            <p className="text-xs text-slate-500">No likes yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {likedUsers.map((user) => (
                <Link
                  key={user.id}
                  to={user.id ? `/profile/${user.id}` : "/profile"}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                  <span>{user.username}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {showComments && (
        <div className="p-4 bg-slate-50/50 space-y-3">
          {interactionError && (
            <p role="alert" className="text-xs text-rose-600">
              {interactionError}
            </p>
          )}
          {commentsLoading && (
            <p className="text-xs text-slate-500">Loading comments...</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Comments
            </p>
            <button
              type="button"
              onClick={() => setShowComments(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Close comments
            </button>
          </div>

          <form
            onSubmit={handleAddComment}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FaPaperPlane className="text-xs" />
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {!commentsLoading && comments.length === 0 && (
              <p className="text-xs text-slate-500">No comments yet.</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <div className="mt-0.5 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-slate-300 text-xs font-bold text-slate-700">
                  {comment.avatar ? (
                    <img
                      src={comment.avatar}
                      alt={comment.user}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {comment.user.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {comment.user}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {comment.createdAt}
                    </span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveComment(comment.id)}
                          disabled={commentSavingId === comment.id}
                          className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] text-white disabled:opacity-50"
                        >
                          {commentSavingId === comment.id
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600">{comment.text}</p>
                      {currentUser?.id &&
                        comment.commenterId === currentUser.id && (
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.text);
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                              aria-label="Edit comment"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            {commentDeleteConfirmId === comment.id ? (
                              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1">
                                <span className="text-[10px] text-rose-700">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCommentDeleteConfirmId(null)
                                  }
                                  className="text-[10px] text-slate-600"
                                >
                                  No
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  disabled={commentDeletingId === comment.id}
                                  className="text-[10px] font-medium text-rose-700 disabled:opacity-50"
                                >
                                  {commentDeletingId === comment.id
                                    ? "Deleting..."
                                    : "Yes"}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setCommentDeleteConfirmId(comment.id)
                                }
                                className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                aria-label="Delete comment"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            )}
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {commentsHasMore && (
            <button
              type="button"
              onClick={handleLoadMoreComments}
              disabled={loadingMoreComments}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
            >
              {loadingMoreComments
                ? "Loading comments..."
                : `Load more comments (${Math.max(0, commentCount - comments.length)} remaining)`}
            </button>
          )}
        </div>
      )}
      {interactionError && !showComments && (
        <p className="px-4 pb-3 text-xs text-rose-600">{interactionError}</p>
      )}
      </div>
      {successMessage && (
        <PostSuccessPopup
          message={successMessage}
          onClose={handleSuccessPopupClose}
        />
      )}
    </>
  );
};

export default FeedCard;
