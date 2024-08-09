import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the Socket.io server
const socket = io('http://localhost:4000');

function App() {
  const [userId, setUserId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [currentChat, setCurrentChat] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server with ID:', socket.id);
    });

    socket.on('private message', ({ senderId, message }) => {
      console.log('Private message received:', senderId, message);
      const chatId = [senderId, userId].sort().join('-');
      setMessages((prevMessages) => ({
        ...prevMessages,
        [chatId]: [...(prevMessages[chatId] || []), { senderId, message }]
      }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('private message');
    };
  }, [userId]);

  const handleRegister = () => {
    socket.emit('register', userId);
  };

  const handleChatSelect = (chatId) => {
    setCurrentChat(chatId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const chatId = [userId, recipientId].sort().join('-');
    socket.emit('private message', { senderId: userId, recipientId, message });
    setMessages((prevMessages) => ({
      ...prevMessages,
      [chatId]: [...(prevMessages[chatId] || []), { senderId: userId, message }]
    }));
    setMessage('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chat App</h1>
      </header>
      <div className="chat-list">
        <input
          type="text"
          placeholder="Your ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
        <input
          type="text"
          placeholder="Recipient ID"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
        />
        <button onClick={() => handleChatSelect([userId, recipientId].sort().join('-'))}>Start Chat</button>
        {Object.keys(messages).map((chatId) => (
          <button key={chatId} onClick={() => handleChatSelect(chatId)}>
            Chat with {chatId.replace(userId, '').replace('-', '')}
          </button>
        ))}
      </div>
      <div className="chat-window">
        {currentChat && (
          <>
            <h2>Chat with {currentChat.replace(userId, '').replace('-', '')}</h2>
            <ul>
              {messages[currentChat]?.map((msg, index) => (
                <li key={index} className={msg.senderId === userId ? 'own-message' : ''}>
                  <strong>{msg.senderId}:</strong> {msg.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {currentChat && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  );
}

export default App;
