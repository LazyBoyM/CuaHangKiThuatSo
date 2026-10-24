import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatWidget from './ChatWidget'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <Navbar />
      <main className="flex-grow pt-8">
        <Outlet />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  )
}