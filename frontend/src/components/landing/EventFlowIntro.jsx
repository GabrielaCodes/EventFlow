import React from 'react';
import './EventFlowIntro.css';
import logo from './logo.png';

const EventFlowIntro = () => {
  return (
    <div className="eventflow-intro-container">
      <div className="intro-wrapper">
        
        {/* 1. Large Portrait Logo on the Left */}
        <div className="logo-container">
          <img src={logo} alt="EventFlow Logo" className="intro-logo" draggable={false} />
        </div>
        
        {/* 2. Text Content on the Right (Wrapped for vertical stacking) */}
        <div className="text-wrapper">
          <div className="ticker-container">
            <div className="static-text">We craft:</div>
            
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

          {/* New Scroll Prompt */}
          <div className="scroll-cta">
            Scroll to discover celebrations made seamless.
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default EventFlowIntro;