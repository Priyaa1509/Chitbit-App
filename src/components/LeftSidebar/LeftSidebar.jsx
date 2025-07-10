import React, { useContext, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, setDoc, serverTimestamp, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import { getDoc } from 'firebase/firestore';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
  const [user, setUser] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const inputHandler = async (e) => {
    try {
      const input = e.target.value.trim();
      if (input) {
        setShowSearch(true);
        const userRef = collection(db, 'users');
        const q = query(userRef, where("username", "==", input.toLowerCase()));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const foundUser = querySnap.docs[0].data();

          if (foundUser.id !== userData.id) {
            let userExist = false;
            chatData?.map((chat) => {
              if (chat.rId === foundUser.id) {
                userExist = true;
              }
            });

            if (!userExist) {
              setUser(foundUser);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setShowSearch(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Something went wrong while searching.");
    }
  };

  const addChat = async () => {
    const messagesRef = collection(db, "messages");
    const chatsRef = collection(db, "chats");

    try {
      const newMessageRef = doc(messagesRef);
      await setDoc(newMessageRef, {
        createdAt: serverTimestamp(),
        messages: []
      });

      const chatDataPayload = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: user.id,
        updateAt: Date.now(),
        messageSeen: true
      };

      const receiverPayload = {
        messageId: newMessageRef.id,
        lastMessage: "",
        rId: userData.id,
        updateAt: Date.now(),
        messageSeen: false
      };

      await updateDoc(doc(chatsRef, userData.id), {
        chatsData: arrayUnion(chatDataPayload)
      });

      await updateDoc(doc(chatsRef, user.id), {
        chatsData: arrayUnion(receiverPayload)
      });

      toast.success("New chat started!");
      setUser(null);
      setShowSearch(false);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error(error.message);
    }
  }

  const setChat = async (item) => {
    try {
      setMessagesId(item.messageId);
      setChatUser(item);
      const userChatsRef = doc(db, 'chats', userData.id);
      const userChatsSnapshot = await getDoc(userChatsRef);
      const userChatsData = userChatsSnapshot.data();
      console.log(userChatsData);
      const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
      userChatsData.chatsData[chatIndex].messageSeen = true;
      await updateDoc(userChatsRef, {
        chatsData: userChatsData.chatsData
      });
      setChatVisible(true);
    } catch (error) {
      toast.error(error.message);
    }
  };





  return (
    <div className={`ls ${chatVisible ? "hidden" : ""}`}>      <div className='ls-top'>
      <div className='ls-nav'>
        <div className='logo-wrap'>
          <img src={assets.logo} className='logo' alt='Logo' />
        </div>
        <div className='menu'>
          <img src={assets.menu_icon} alt='Menu' />
          <div className="sub-menu">
            <p onClick={() => navigate('/profile')}>Edit Profile</p>
            <hr />
            <p>Logout</p>
          </div>
        </div>
      </div>
    </div>

      <div className='ls-search'>
        <img src={assets.search_icon} alt='Search' />
        <input onChange={inputHandler} type='text' placeholder='Search here' />
      </div>

      <div className='ls-list'>
        {showSearch && user ? (
          <div className='friends add-user' onClick={addChat} style={{ cursor: "pointer" }}>
            <img src={user.avatar} alt='' />
            <p>{user.name}</p>
          </div>
        ) : (
          (chatData || []).map((item, index) => {
            const lastSeen = item.userData.lastSeen;
            const isOnline = lastSeen && (Date.now() - lastSeen < 2 * 60 * 1000);

            return (
              <div
                onClick={() => setChat(item)}
                key={index}
                className={`friends ${!item.messageSeen && item.rId === userData.id ? 'unread' : ''}`}
              >

                <div className="avatar-status">
                  <img src={item.userData.avatar} alt='Profile' />
                  {isOnline && <span className="green-dot" />}
                </div>

                <div>
                  <p>{item.userData.name}</p>
                  <span>{item.lastMessage}</span>
                  {lastSeen && (
                    <span className='last-seen'>
                      {isOnline
                        ? 'Online'
                        : `Last seen: ${new Date(lastSeen).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
