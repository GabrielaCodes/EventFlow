import React from 'react';
import './EventFlowIntro.css';
import logo from './logo.png';

const EventFlowIntro = () => {
  return (
    <div className="eventflow-intro-container">
      <div className="ticker-container">
        
        {/* 1. Large Logo on the Left */}
        <img src={logo} alt="EventFlow Logo" className="intro-logo" />
        
        {/* 2. Static "We host:" Text */}
        <div className="static-text">We host:</div>
        
        {/* 3. The 3D Scrolling List */}
        <div className="scroller-window">
          <ul className="scrolling-list">
            {/* Visually ABOVE "Dreamy Weddings" at the very start */}
            <li aria-hidden="true">Unforgettable Memories</li> 

            {/* The Core List */}
            <li>Dreamy Weddings</li>
            <li>Proud Graduations</li>
            <li>Electric College Fests</li>
            <li>Bold Tech Events</li>
            <li>Unforgettable Memories</li>

            {/* Visually BELOW the loop to make the restart invisible */}
            <li aria-hidden="true">Dreamy Weddings</li>
            <li aria-hidden="true">Proud Graduations</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
};

export default EventFlowIntro;