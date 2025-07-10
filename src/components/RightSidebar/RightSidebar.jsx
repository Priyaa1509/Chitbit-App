import React, { useContext, useState } from 'react';
import './RightSidebar.css';
import assets from '../../assets/assets';
import { logout } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { getDoc } from 'firebase/firestore';

const RightSidebar = () => {
  const { chatUser, userData, messages, chatVisible } = useContext(AppContext);
  const [popupImg, setPopupImg] = useState(null);

  const activeUser = chatUser ? chatUser.userData : userData;
  const isOnline =
    activeUser?.lastSeen && Date.now() - activeUser.lastSeen < 2 * 60 * 1000;

  const images = messages.filter((msg) => msg.type === 'image');

  return (
    <div className={`rs ${!chatVisible ? 'mobile-hide' : ''}`}>
      <div className="rs-profile">
        <img src={activeUser?.avatar || assets.default_avatar} alt="User" />
        <h3>
          {activeUser?.name || 'Loading...'}
          {isOnline && <img src={assets.green_dot} className="dot" alt="Online" />}
        </h3>
        <p>{activeUser?.bio || 'No bio available.'}</p>
      </div>

      <hr className="media-separator" />

      <div className="rs-media">
        <p>Media</p>
        <div className="media-grid">
          {images.length > 0 ? (
            images.map((img, idx) => (
              <img
                key={idx}
                src={img.imageBase64}
                alt="media"
                onClick={() => setPopupImg(img.imageBase64)}
                className="media-img"
              />
            ))
          ) : (
            <p className="no-media">No media yet</p>
          )}
        </div>
      </div>

      <button onClick={logout} className="logout-btn">
        Logout
      </button>

      {popupImg && (
        <div className="popup-overlay" onClick={() => setPopupImg(null)}>
          <img src={popupImg} className="popup-image" alt="Zoom" />
        </div>
      )}
    </div>
  );
};

export default RightSidebar;
