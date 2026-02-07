import React from 'react';
import LandingNavbar from '../components/common/LandingNavbar';
import WeddingSection from '../components/landing/WeddingSection';
import TheatreSection from '../components/landing/TheatreSection';
import GraduationSection from '../components/landing/GraduationSection';
import ConcertSection from '../components/landing/ConcertSection';
import ContactSection from '../components/landing/ContactSection';

const LandingPage = () => {
  return (
    <div className="landing-page-wrapper">
      <LandingNavbar />
      
      {/* Sections with IDs for scrolling */}
      <section id="wedding">
        <WeddingSection />
      </section>
      
      <section id="theatre">
        <TheatreSection />
      </section>
      
      <section id="graduation">
        <GraduationSection />
      </section>
      
      <section id="concert">
        <ConcertSection />
      </section>
      
      <section id="contact">
        <ContactSection />
      </section>
    </div>
  );
};

export default LandingPage;