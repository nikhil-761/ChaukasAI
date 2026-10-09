import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Splash from './components/Splash'
import GuidedTutor from './components/GuidedTutor'
import LangWelcome from './components/LangWelcome'
import ApiStatus from './components/ApiStatus'
import Landing from './pages/Landing'
import Report from './pages/Report'
import Track from './pages/Track'
import Dashboard from './pages/Dashboard'
import Department from './pages/Department'
import Admin from './pages/Admin'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-[100dvh]">
      <Splash />
      <ApiStatus />
      <ScrollTop />
      <Navbar />
      <main key={pathname.split('/')[1] || 'home'} className="page-pad animate-fadeIn">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/report" element={<Report />} />
          <Route path="/track" element={<Track />} />
          <Route path="/track/:id" element={<Track />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/department" element={<Department />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <Footer />
      <GuidedTutor />
      <LangWelcome />
    </div>
  )
}
