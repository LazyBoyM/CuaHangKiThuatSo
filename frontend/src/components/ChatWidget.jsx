import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';
import Card from './Card';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

let socket;

export const useChatSocket = () => {
  const { token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socketUrl = api.defaults.baseURL.replace('/api', '');
    socket = io(socketUrl, { auth: { token }, path: '/socket.io/' });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    return () => { socket.disconnect(); };
  }, [token]);

  return { socket, isConnected };
};

export default function ChatWidget() {
  const { user } = useAuthStore();
  const { socket } = useChatSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { receiverId }
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  // names cache — cả state lẫn ref để tránh stale closure
  const [names, setNames] = useState({});
  const namesRef = useRef({});
  const messagesEndRef = useRef(null);

  const normalizeId = (v) => (v === undefined || v === null ? '' : String(v));

  // Fetch và cache tên user — dùng ref để tránh closure stale
  const fetchUserName = async (userId) => {
    const uid = normalizeId(userId);
    if (!uid) return;
    if (namesRef.current[uid] && namesRef.current[uid] !== 'Đang tải...') return;

    namesRef.current[uid] = 'Đang tải...'; // placeholder để tránh double-fetch
    try {
      const res = await api.get(`/users/${uid}/display`);
      const name = res.data?.name || 'Người dùng';
      namesRef.current[uid] = name;
      setNames(prev => ({ ...prev, [uid]: name }));
    } catch {
      namesRef.current[uid] = 'Người dùng';
      setNames(prev => ({ ...prev, [uid]: 'Người dùng' }));
    }
  };

  const getName = (userId) => names[userId] || namesRef.current[userId] || 'Đang tải...';

  // Expose global function cho ProductDetail dùng
  useEffect(() => {
    window.openChatWith = (sellerId, sellerName) => {
      if (!user) return alert('Vui lòng đăng nhập để chat');
      if (user.role === 'seller') return alert('Người bán không được phép chủ động nhắn tin trước.');
      if (user._id === sellerId || user.id === sellerId) return alert('Không thể chat với chính mình');
      // Nếu đã có tên từ ngoài (VD: từ trang shop), lưu luôn vào cache
      if (sellerName) {
        namesRef.current[sellerId] = sellerName;
        setNames(prev => ({ ...prev, [sellerId]: sellerName }));
      }
      setActiveChat({ receiverId: sellerId });
      setIsOpen(true);
      fetchMessages(sellerId);
      fetchUserName(sellerId);
    };
  }, [user]);

  useEffect(() => {
    if (isOpen && user) fetchConversations();
  }, [isOpen, user]);

  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = async (msg) => {
      fetchConversations();
      
      // Đảm bảo có tên trong cache cho người gửi
      const myId = normalizeId(user._id || user.id);
      const senderId = normalizeId(msg.sender);
      const receiverId = activeChat ? normalizeId(activeChat.receiverId) : '';

      if (senderId && senderId !== myId) {
        await fetchUserName(senderId);
      }

      if (activeChat && (senderId === receiverId || senderId === myId)) {
        setMessages(prev => [...prev, msg]);
      } else {
        if (senderId && senderId !== myId) {
          const senderName = namesRef.current[senderId] || msg.senderName || 'Người dùng';
          toast(`${senderName}: ${msg.text}`, { duration: 4000, position: 'bottom-right' });
        }
      }
    };
    socket.on('receive_message', handleReceiveMessage);
    return () => socket.off('receive_message', handleReceiveMessage);
  }, [socket, activeChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      const convs = res.data;
      setConversations(convs);
      // Fetch tên tất cả participants chưa có
      convs.forEach(conv => {
        const otherId = conv.participants.find(id => id !== (user._id || user.id));
        if (otherId) fetchUserName(otherId);
      });
    } catch (err) {
      console.error('Lỗi tải danh sách chat:', err);
    }
  };

  const fetchMessages = async (receiverId) => {
    try {
      const res = await api.get(`/chat/messages/${receiverId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !socket) return;
    socket.emit('send_message', { receiverId: activeChat.receiverId, text: inputText });
    setInputText('');
  };

  const myId = user ? normalizeId(user._id || user.id) : '';

  const unreadCount = conversations.reduce((count, conv) => {
    const lastSenderId = conv?.lastMessage?.sender ? normalizeId(conv.lastMessage.sender) : '';
    if (conv.lastMessage && lastSenderId !== myId && !conv.lastMessage.read) {
      return count + 1;
    }
    return count;
  }, 0);

  if (!user || user.role === 'admin') return null;

  // Tên hiển thị ở header — luôn lấy từ names state (reactive)
  const activeReceiverId = activeChat ? normalizeId(activeChat.receiverId) : '';
  const activeName = activeChat ? (names[activeReceiverId] || namesRef.current[activeReceiverId] || 'Đang tải...') : 'Tin nhắn';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-primary-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="w-80 sm:w-96 h-[500px] flex flex-col shadow-2xl border-gray-200 overflow-hidden" padding="none">
          {/* Header */}
          <div className="bg-primary-600 p-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              {activeChat && (
                <button onClick={() => setActiveChat(null)} className="hover:bg-primary-700 p-1 rounded">
                  ←
                </button>
              )}
              <h3 className="font-semibold truncate max-w-[200px]" title={activeName}>
                {activeName}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 p-1 text-xl leading-none shrink-0">
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-white">
            {!activeChat ? (
              // Conversation List
              <div className="divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm mt-10">
                    Chưa có tin nhắn nào
                  </div>
                ) : (
                  conversations.map(conv => {
                    const myId = normalizeId(user._id || user.id);
                    const otherId = conv.participants.find(id => normalizeId(id) !== myId);
                    const otherIdNorm = normalizeId(otherId);
                    const lastSenderId = normalizeId(conv?.lastMessage?.sender);
                    const isUnread = !!conv.lastMessage && lastSenderId !== myId && !conv.lastMessage?.read;
                    const displayName = names[otherIdNorm] || namesRef.current[otherIdNorm] || 'Đang tải...';

                    return (
                      <div
                        key={conv._id}
                        onClick={() => {
                          setActiveChat({ receiverId: otherIdNorm });
                          fetchMessages(otherId);
                          fetchUserName(otherId);
                        }}
                        className={`p-4 hover:bg-gray-100 cursor-pointer flex gap-3 items-center transition-colors ${isUnread ? 'bg-primary-50/20' : ''}`}
                      >
                        {/* Avatar chữ cái đầu */}
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                          {displayName?.charAt?.(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                              {displayName}
                            </span>
                            {isUnread && <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0"></div>}
                          </div>
                          <p className={`text-xs truncate ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>
                            {conv.lastMessage?.text || 'Bắt đầu trò chuyện'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Message List
              <div className="p-4 space-y-4">
                {messages.map((msg, i) => {
                  const myId2 = normalizeId(user._id || user.id);
                  const isMine = normalizeId(msg.sender) === myId2;
                  return (
                    <div key={i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {format(new Date(msg.createdAt || Date.now()), 'HH:mm')}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {activeChat && (
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Nhắn tin với ${activeName}...`}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5 translate-x-[1px] -translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
