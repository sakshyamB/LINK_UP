import React from 'react'
import { useNavigate } from 'react-router-dom'

const Logoutpopup = ({ setLogoutpopup, setprofile }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setLogoutpopup(false)
    if (typeof setprofile === "function") {
      setprofile(false)
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Confirm Logout</h2>
        <p className="mb-6 text-sm leading-6 text-slate-600">
          Are you sure you want to logout?
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setLogoutpopup(false)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}

export default Logoutpopup