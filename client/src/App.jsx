import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPgae from './pages/LoginPgae'
import ProfilePage from './pages/ProfilePage'
import {Toaster} from "react-hot-toast"
import { AuthContext } from './context/AuthContext'

const App = () => {
  const { authUser, isLoading } = useContext(AuthContext)

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[url('./src/assets/bgImage.svg')] bg-contain flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain ">
      <Toaster/>
      <Routes>
        <Route 
          path='/' 
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route 
          path='/login' 
          element={!authUser ? <LoginPgae/> : <Navigate to="/" replace />} 
        />
        <Route 
          path='/profile' 
          element={authUser ? <ProfilePage/> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  )
}

export default App