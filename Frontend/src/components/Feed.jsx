import React, { useEffect, useState } from 'react'
import CreatePost from './CreatePost'
import FeedCard from './FeedCard'
import axios from 'axios' 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const Feed = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const fetchFeed = async () => {
      try {
        const data = await axios.get(`${API_URL}/post/feed`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (active) setPosts(data.data.feed || [])
      } catch (error) {
        console.error('Failed to fetch feed:', error)
        if (active) setError(error.response?.data?.message || 'Unable to load your feed.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchFeed()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-2xl">
      <CreatePost/>
      <div className="space-y-5">
        {loading && <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4 h-4 w-1/3 rounded bg-slate-200"/><div className="mb-2 h-3 w-full rounded bg-slate-100"/><div className="h-56 rounded-lg bg-slate-100"/></div>}
        {error && <p role="alert" className="border-y border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {!loading && !error && posts.length === 0 && <p className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Your feed is quiet. Add friends to see their posts here.</p>}
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={{
              ...post,
              author: {
                id: post.author?.id,
                username: post.author?.username,
                avatar: post.author?.profilePicture,
              },
              content: post.caption,
              image: post.imageUrl,
              likeCount: post._count?.likes || 0,
              comments: [],
              isLiked: post.isLikedByMe,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default Feed
