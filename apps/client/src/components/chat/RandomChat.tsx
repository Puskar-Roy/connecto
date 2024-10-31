import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { FiSettings, FiSend, FiX } from 'react-icons/fi';


interface ChatMessage {
  from: string;
  text: string;
}

interface PartnerInfo {
  name: string;
}

interface ServerToClientEvents {
  connectedToChatPartner: (partnerInfo: PartnerInfo) => void;
  receiveMessage: (message: ChatMessage) => void;
  partnerDisconnected: () => void;
}

interface ClientToServerEvents {
  findChatPartner: (details: { name: string; gender: string; preference: string }) => void;
  findRandomChatPartner: (details: { name: string; gender: string }) => void;
  sendMessage: (message: { text: string }) => void;
  disconnectPartner: () => void;
}


const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3000');

const RandomChat: React.FC = () => {
  const [partner, setPartner] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [name, setName] = useState<string>(localStorage.getItem('name') || '');
  const [gender, setGender] = useState<string>(localStorage.getItem('gender') || '');
  const [preference, setPreference] = useState<string>(localStorage.getItem('preference') || '');

  useEffect(() => {

    socket.on('connectedToChatPartner', (partnerInfo) => {
      setPartner(partnerInfo.name);
      setLoading(false);
      alert(`You have been connected to ${partnerInfo.name}!`);
    });

    socket.on('receiveMessage', (message) => {
      setChat((prevChat) => [...prevChat, { from: message.from, text: message.text }]);
    });

    socket.on('partnerDisconnected', () => {
      alert('Your chat partner has disconnected. Finding a new partner...');
      setPartner(null);
      setChat([]);
      findRandomChatPartner();
    });

    return () => {
      socket.off('connectedToChatPartner');
      socket.off('receiveMessage');
      socket.off('partnerDisconnected');
    };
  }, []);

  const saveUserDetails = () => {
    localStorage.setItem('name', name);
    localStorage.setItem('gender', gender);
    localStorage.setItem('preference', preference);
  };

  const findChatPartner = () => {
    if (name && gender && preference) {
      saveUserDetails();
      setLoading(true);
      socket.emit('findChatPartner', { name, gender, preference });
    } else {
      alert('Please enter your name, select your gender, and your preferred gender.');
    }
  };

  const findRandomChatPartner = () => {
    if (name && gender) {
      saveUserDetails();
      setLoading(true);
      socket.emit('findRandomChatPartner', { name, gender });
    } else {
      alert('Please enter your name and select your gender.');
    }
  };

  const sendMessage = () => {
    if (message.trim() !== '' && partner) {
      socket.emit('sendMessage', { text: message });
      setChat((prevChat) => [...prevChat, { from: 'You', text: message }]);
      setMessage('');
    }
  };

  const disconnect = () => {
    socket.emit('disconnectPartner');
    setPartner(null);
    setChat([]);
    alert('You have disconnected from the chat.');
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen space-y-20">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <header className="w-full max-w-md bg-white text-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
          <h1 className="text-xl font-semibold">Chat App</h1>
        </header>

        <button
          className="fixed bottom-6 right-6 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition duration-300"
          onClick={toggleSettings}
        >
          <FiSettings size={24} />
        </button>


        {isSettingsOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full relative">
              <button
                className="absolute top-2 right-2 bg-gray-200 p-1 rounded-full hover:bg-gray-300 transition duration-300"
                onClick={toggleSettings}
              >
                <FiX size={18} />
              </button>
              <h3 className="text-xl font-semibold mb-4">Settings</h3>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-2 mb-2 border rounded-lg shadow-md"
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 mb-2 border rounded-lg shadow-md"
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="w-full p-2 mb-4 border rounded-lg shadow-md"
              >
                <option value="">Select preferred gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <button
                className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition duration-300"
                onClick={saveUserDetails}
              >
                Save Details
              </button>
            </div>
          </div>
        )}

        {!partner && (
          <div className="w-full max-w-md mt-4">
            {loading ? (
              <div className="text-center text-gray-600 animate-bounce">Finding a chat partner... Please wait.</div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 mb-4 transition duration-300"
                  onClick={findChatPartner}
                >
                  Find Chat Partner
                </button>
                <button
                  className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition duration-300"
                  onClick={findRandomChatPartner}
                >
                  Find Random Chat Partner
                </button>
              </div>
            )}
          </div>
        )}

        {partner && (
          <div className="w-full max-w-md bg-white p-4 mt-4 rounded-lg shadow-md flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Chat with {partner}</h2>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition duration-300"
                onClick={disconnect}
              >
                Disconnect
              </button>
            </div>
            <div className="flex-grow overflow-y-auto mb-4">
              {chat.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-2 ${msg.from === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${msg.from === 'You' ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'
                      } p-3 rounded-lg max-w-xs shadow-md animate-slide-in`}
                  >
                    <strong>{msg.from}</strong>: {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
                className="w-full p-2 border rounded-lg shadow-md mr-2"
              />
              <button
                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition duration-300"
                onClick={sendMessage}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default RandomChat;
