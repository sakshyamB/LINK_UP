import React from 'react'
import Leftbar from '../components/Leftbar'
import Navbar from '../components/Navbar'
import Feed from '../components/Feed'

const Home = () => {
  return (
    <div>
      <Navbar/>
      <Leftbar/>
      <Feed/>
    </div>
  )
}

export default Home
