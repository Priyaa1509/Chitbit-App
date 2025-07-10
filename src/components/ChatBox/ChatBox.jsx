import React, { useContext, useEffect, useState, useRef } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { db } from '../../config/firebase';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';


const ChatBox = () => {
  const { userData, messagesId, chatUser, messages, setMessages, chatVisible, setChatVisible } = useContext(AppContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null); // 👈 scroll anchor ref
  const navigate = useNavigate();


  const convertTimeStamp = (timestamp) => {
    let date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        const newMsg = {
          sId: userData.id,
          type: "text",
          text: input,
          createdAt: new Date(),
        };

        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion(newMsg),
        });

        const userIDs = [chatUser.rId, userData.id];
        for (const id of userIDs) {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnap = await getDoc(userChatsRef);

          if (userChatsSnap.exists()) {
            const chatsData = userChatsSnap.data().chatsData;
            const index = chatsData.findIndex((c) => c.messageId === messagesId);

            if (index !== -1) {
              chatsData[index].lastMessage = newMsg.text.slice(0, 30);
              chatsData[index].updateAt = Date.now();
              if (chatsData[index].rId === userData.id) {
                chatsData[index].messageSeen = false;
              }

              await updateDoc(userChatsRef, { chatsData });
            }
          }
        }

        setInput("");
      }
    } catch (error) {
      console.error("Send Message Error:", error.message);
    }
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !messagesId) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;

        const imageMsg = {
          sId: userData.id,
          type: "image",
          imageBase64: base64,
          createdAt: new Date(),
        };

        await updateDoc(doc(db, 'messages', messagesId), {
          messages: arrayUnion(imageMsg),
        });

        const userIDs = [chatUser.rId, userData.id];
        for (const id of userIDs) {
          const userChatsRef = doc(db, 'chats', id);
          const userChatsSnap = await getDoc(userChatsRef);

          if (userChatsSnap.exists()) {
            const chatsData = userChatsSnap.data().chatsData;
            const index = chatsData.findIndex((c) => c.messageId === messagesId);

            if (index !== -1) {
              chatsData[index].lastMessage = "📷 Photo";
              chatsData[index].updateAt = Date.now();
              if (chatsData[index].rId === userData.id) {
                chatsData[index].messageSeen = false;
              }

              await updateDoc(userChatsRef, { chatsData });
            }
          }
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Send Image Error:", err.message);
    }
  };

  useEffect(() => {
    if (!messagesId || !chatUser) return;

    const msgRef = doc(db, "messages", messagesId);
    const unSub = onSnapshot(msgRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawMessages = docSnap.data().messages || [];
        const sortedMessages = rawMessages.sort((a, b) => {
          const aTime = a.createdAt?.seconds
            ? a.createdAt.seconds
            : new Date(a.createdAt).getTime() / 1000;
          const bTime = b.createdAt?.seconds
            ? b.createdAt.seconds
            : new Date(b.createdAt).getTime() / 1000;
          return aTime - bTime;
        });

        setMessages(sortedMessages);
      }
    });

    return () => unSub();
  }, [messagesId, chatUser, setMessages]);

  // 👇 Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? '' : 'hidden'}`}>
      <div className='chat-user'>
        <img src={chatUser.userData.avatar || assets.default_avatar} alt='User' />
        <p>
          {chatUser.userData.name}
          <img className='dot' src={assets.green_dot} alt='Online' />
        </p>
        <img src={assets.help_icon} className='help' alt='Help' />
        <img
  onClick={() => {
    setChatVisible(false);     // Hide chat view
    navigate('/chat?refresh=' + Date.now());
        // Navigate to chat list
  }}
  src={assets.arrow_icon}
  className="arrow"
  alt="Back"
/>


      </div>

      <div className="chat-msg">
        {messages.map((msg, index) => {
          const isSender = msg.sId === userData.id;
          return (
            <div key={index} className={`msg-row ${isSender ? 'right' : 'left'}`}>
              {!isSender && (
                <img
                  src={chatUser.userData.avatar || assets.default_avatar}
                  alt="sender"
                  className="avatar"
                />
              )}
              <div>
                {msg.type === "image" && msg.imageBase64 ? (
                  <img src={msg.imageBase64} className="msg-image" alt="sent-img" />
                ) : (
                  <p className={`msg ${isSender ? 'outgoing' : 'incoming'}`}>{msg.text}</p>
                )}
                <p className="timestamp">
                  {msg.createdAt
                    ? convertTimeStamp(
                      msg.createdAt?.seconds
                        ? new Date(msg.createdAt.seconds * 1000)
                        : msg.createdAt
                    )
                    : ""}
                </p>
              </div>
              {isSender && (
                <img
                  src={userData.avatar || assets.default_avatar}
                  alt="me"
                  className="avatar"
                />
              )}
            </div>
          );
        })}
        {/* 👇 Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <div className='chat-input'>
        <input
          type='text'
          placeholder='Send a message'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <input
          type='file'
          id='image'
          accept='image/png, image/jpeg'
          hidden
          onChange={sendImage}
        />
        <label htmlFor='image'>
          <img src={assets.gallery_icon} alt='Gallery' />
        </label>
        <img
          src={assets.send_button}
          alt='Send'
          onClick={sendMessage}
          style={{ cursor: "pointer" }}
        />
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${chatVisible ? '' : 'hidden'}`}>
      <img src={assets.logo_icon} alt="Welcome" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
