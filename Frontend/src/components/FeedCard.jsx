import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaHeart,
    FaRegHeart,
    FaRegComment,
    FaRegShareSquare,
    FaEllipsisH,
    FaPaperPlane
} from 'react-icons/fa';

const FeedCard = ({ post, currentUser }) => {
    const [isLiked, setIsLiked] = useState(post?.isLiked || false);
    const [likeCount, setLikeCount] = useState(post?.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post?.comments || []);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        // TODO: Call API endpoint to toggle post like
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const newComment = {
            id: Date.now(),
            user: currentUser?.username || 'You',
            avatar: currentUser?.avatar,
            text: commentText,
            createdAt: 'Just now',
        };

        setComments([...comments, newComment]);
        setCommentText('');
        // TODO: Call API endpoint to persist comment
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">

            {/* 1. Header: Author Info & Actions */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center space-x-3">
                    <Link to={`/profile/${post?.author?.username || ''}`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm ring-2 ring-indigo-50">
                            {post?.author?.avatar ? (
                                <img
                                    src={post.author.avatar}
                                    alt={post.author.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                post?.author?.username?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                    </Link>
                    <div>
                        <Link
                            to={`/profile/${post?.author?.username || ''}`}
                            className="font-bold text-sm text-slate-800 hover:text-indigo-600 transition"
                        >
                            {post?.author?.username || 'User Name'}
                        </Link>
                        <p className="text-xs text-slate-400">
                            {post?.createdAt || '2 hours ago'}
                        </p>
                    </div>
                </div>

                {/* Options Menu Button */}
                <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition">
                    <FaEllipsisH className="text-sm" />
                </button>
            </div>

            {/* 2. Post Text Content */}
            {post?.content && (
                <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {post.content}
                </p>
            )}

            {/* 3. Post Image (if present) */}
            {post?.image && (
                <div className="w-full bg-slate-100 max-h-[480px] overflow-hidden flex items-center justify-center">
                    <img
                        src={post.image}
                        alt="Post content"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* 4. Stats Bar (Likes & Comments Count) */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px]">
                        <FaHeart />
                    </span>
                    <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                </div>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="hover:underline text-slate-500"
                >
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </button>
            </div>

            {/* 5. Action Buttons (Like, Comment, Share) */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold transition ${isLiked
                            ? 'text-rose-500 hover:bg-rose-50'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                >
                    {isLiked ? <FaHeart className="text-rose-500 text-base" /> : <FaRegHeart className="text-base" />}
                    <span>Like</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                    <FaRegComment className="text-base text-slate-400" />
                    <span>Comment</span>
                </button>

                <button
                    className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                    <FaRegShareSquare className="text-base text-slate-400" />
                    <span>Share</span>
                </button>
            </div>

            {/* 6. Comments Section */}
            {showComments && (
                <div className="p-4 bg-slate-50/50 space-y-3">

                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex items-center space-x-2">
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

                    {/* Comment List */}
                    <div className="space-y-2 pt-2">
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                    {comment.avatar ? (
                                        <img src={comment.avatar} alt={comment.user} className="w-7 h-7 rounded-full object-cover" />
                                    ) : (
                                        comment.user.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-xs text-slate-800">{comment.user}</span>
                                        <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                                    </div>
                                    <p className="text-xs text-slate-600">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}

        </div>
    );
};

export default FeedCard;