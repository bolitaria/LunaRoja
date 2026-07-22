import React from 'react';
import instagramIcon from '../assets/icons/instagram.svg';

const SocialLinks = () => {
  const instagramUrl = process.env.REACT_APP_INSTAGRAM_URL || 'https://www.instagram.com/';

  return (
    <div className="social-links">
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <img src={instagramIcon} alt="Instagram" width="32" height="32" />
      </a>
    </div>
  );
};

export default SocialLinks;
