import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const socketRef = useRef(null)

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    try {
      const res = await api.get('/notifications')
      const list = res.data || []
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.isRead).length)
    } catch (err) {
      console.error('Fetch notifications error:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()

      // Connect to Notification Socket
      const socket = io('/', {
        path: '/notification-socket/',
        transports: ['websocket']
      })

      socket.on('connect', () => {
        const token = localStorage.getItem('token')
        socket.emit('authenticate', token)
      })

      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        toast(notification.message, { 
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        })
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    }
  }, [isAuthenticated])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const handleClearAll = async () => {
    if (!window.confirm('Xóa tất cả thông báo?')) return
    try {
      await api.delete('/notifications/all')
      setNotifications([])
      setUnreadCount(0)
    } catch {}
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} giờ trước`
    return `${Math.floor(hours / 24)} ngày trước`
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'PAYMENT_SUCCESS': return 'bg-emerald-500';
      case 'NEW_ORDER': return 'bg-blue-500';
      case 'PRODUCT_APPROVED': return 'bg-amber-500';
      case 'NEW_MESSAGE': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Thông báo"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 transform origin-top-right transition-all">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-800">Thông báo</h3>
            <div className="flex gap-3">
               <button onClick={handleMarkAllAsRead} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Đọc hết</button>
               <button onClick={handleClearAll} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Xóa hết</button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                   </svg>
                </div>
                <p className="text-sm text-gray-400">Hộp thư trống</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id)}
                  className={`w-full text-left px-4 py-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                    !n.isRead ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getTypeStyles(n.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug mb-1 ${!n.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
             <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Xem tất cả thông báo</button>
          </div>
        </div>
      )}
    </div>
  )
}
