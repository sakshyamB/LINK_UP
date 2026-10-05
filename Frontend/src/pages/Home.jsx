import React, { useState } from 'react'
import Leftbar from '../components/Leftbar'
import Navbar from '../components/Navbar'
import Feed from '../components/Feed'
import Rightbar from '../components/Rightbar'
import Logoutpopup from '../components/Logoutpopup'

const Home = () => {

  const [isLogoutPopupOpen, setLogoutpopup] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl items-start">
        <div className="hidden w-64 shrink-0 md:block">
          <Leftbar setlogoutpopup={setLogoutpopup} />
        </div>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <Feed/>
        </main>
        <div className="hidden w-64 shrink-0 md:block">
          <Rightbar/>
        </div>
      </div>
         {isLogoutPopupOpen && (
        <Logoutpopup
          setLogoutpopup={setLogoutpopup}
        />
      )}
    </div>
  )
}

export default Home
