import React from 'react';
import './EventFlowIntro.css';

const EventFlowIntro = () => {
  return (
    <div className="eventflow-intro-container">
      <div className="ticker-container">
        <h3>We are EventFlow</h3>
        <div className="static-text">We host:</div>
        
        <div className="scroller-window">
          <ul className="scrolling-list">
            {/* 1. Visually ABOVE "Dreamy Weddings" at the very start */}
            <li aria-hidden="true">Unforgettable Memories</li> 

            {/* 2. The Core List */}
            <li>Dreamy Weddings</li>
            <li>Proud Graduations</li>
            <li>Electric College Fests</li>
            <li>Bold Tech Events</li>
            <li>Unforgettable Memories</li>

            {/* 3. Visually BELOW the loop to make the restart invisible */}
            <li aria-hidden="true">Dreamy Weddings</li>
            <li aria-hidden="true">Proud Graduations</li>
          </ul>
        </div>
      </div>
      <p>If it matters, we flow with it.</p>
    </div>
  );
};

export default EventFlowIntro;