import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { db, auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible,setChatVisible] = useState(false);

  const loadUserData = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);

        if (data.avatar && data.name) {
          navigate("/chat");
        } else {
          navigate("/profile");
        }

        await updateDoc(userRef, {
          lastSeen: Date.now(),
        });

        // Update lastSeen every 60 seconds
        setInterval(async () => {
          if (auth.currentUser) {
            await updateDoc(userRef, {
              lastSeen: Date.now(),
            });
          }
        }, 60000);
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    if (!userData) return;

    const chatRef = doc(db, "chats", userData.id);
    const unSub = onSnapshot(chatRef, async (res) => {
      const chatItems = res.data()?.chatsData || [];
      const tempData = [];

      for (const item of chatItems) {
        try {
          const userRef = doc(db, "users", item.rId);
          const userSnap = await getDoc(userRef);
          const otherUserData = userSnap.data();

          // ✅ Fix: Manually include messageId
          tempData.push({
            rId: item.rId,
            messageId: item.messageId,
            lastMessage: item.lastMessage,
            updateAt: item.updateAt,
            messageSeen: item.messageSeen,
            userData: otherUserData,
          });
        } catch (err) {
          console.error("Error fetching chat user:", err);
        }
      }

      tempData.sort((a, b) => b.updateAt - a.updateAt);
      setChatData(tempData);
    });

    return () => unSub();
  }, [userData]);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    loadUserData,
    messages, setMessages,
    messagesId, setMessagesId,
    chatUser, setChatUser,
    chatVisible,setChatVisible
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;

