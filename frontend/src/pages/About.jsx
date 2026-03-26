import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom'; // Added for navigation

const About = () => {
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-section]').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    {
      title: 'Seamless Coordination',
      description: 'Unified platform connecting clients, coordinators, managers, and sponsors in real-time collaboration.',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
      ),
    },
    {
      title: 'Smart Employee Assignment',
      description: 'Automatically assigns verified managers to events based on category and current workload, ensuring balanced distribution and efficient handling of tasks.',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      title: 'Premium Experience',
      description: 'Elegant interface designed for professionals who demand excellence in every detail of event execution.',
      icon: (
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ];

  const roles = [
    {
      title: 'Clients',
      description: 'Transform your vision into reality with complete transparency and control over every aspect of your event.',
      color: 'from-[#d4af37]/20 to-transparent',
    },
    {
      title: 'Chief Coordinators',
      description: 'Orchestrate multiple events simultaneously with powerful tools for delegation, oversight, and strategic planning.',
      color: 'from-[#C5A46D]/20 to-transparent',
    },
    {
      title: 'Managers',
      description: 'Execute flawlessly with real-time updates, task management, and direct communication channels with all stakeholders.',
      color: 'from-[#d4af37]/15 to-transparent',
    },
    {
      title: 'Sponsors',
      description: 'Maximize your investment with detailed analytics, brand visibility tracking, and seamless activation coordination.',
      color: 'from-[#C5A46D]/15 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans">
      {/* Hero Section */}
      <section
        data-section="hero"
        className={`relative min-h-screen flex items-center justify-center px-6 py-20 transition-all duration-1000 ${
          visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#050505] to-[#111] opacity-50" />
        
        {/* Radial glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37] opacity-5 blur-[120px] rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            Orchestrating{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] bg-clip-text text-transparent animate-pulse">
                Extraordinary
              </span>
              <span className="absolute inset-0 blur-xl bg-gradient-to-r from-[#d4af37] to-[#C5A46D] opacity-30" />
            </span>{' '}
            Experiences
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            EventFlow is the definitive platform for professionals who refuse to compromise on excellence.
            Where precision meets creativity, and every detail matters.
          </p>
          
          {/* Minimal decorative line */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
            <div className="w-2 h-2 rounded-full bg-[#d4af37]" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section
        data-section="mission"
        className={`relative px-6 py-32 transition-all duration-1000 delay-200 ${
          visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              The <span className="text-[#d4af37]">Mission</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Bridging the gap between vision and execution through intelligent design and seamless collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roles.map((role, index) => (
              <div
                key={index}
                className="group relative bg-[#111] border border-[#1a1a1a] hover:border-[#d4af37]/30 rounded-2xl p-8 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-[#d4af37] to-transparent rounded-full" />
                    <h3 className="text-2xl font-bold text-[#d4af37]">{role.title}</h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed">{role.description}</p>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 border-t border-r border-[#d4af37]/20 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section
        data-section="features"
        className={`relative px-6 py-32 transition-all duration-1000 delay-300 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Core <span className="text-[#d4af37]">Values</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built on principles that define exceptional event management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-[#111] border border-[#1a1a1a] hover:border-[#d4af37] rounded-2xl p-10 transition-all duration-500 hover:-translate-y-3"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                
                {/* Icon container with animated background */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 flex items-center justify-center text-[#d4af37] transition-transform duration-500 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <div className="absolute inset-0 bg-[#d4af37] opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-full" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 text-gray-100 group-hover:text-[#d4af37] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        data-section="contact"
        className={`relative px-6 py-20 transition-all duration-1000 delay-400 ${
          visibleSections.has('contact') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block p-[1px] rounded-2xl bg-gradient-to-b from-[#d4af37]/40 to-transparent">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-12 md:p-16 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(212,175,55,0.05)] transition-transform duration-500 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-[#111] border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-100">Contact Us</h2>
              <p className="text-gray-400 max-w-lg">
                Have questions or need custom enterprise solutions? Reach out to our dedicated support team.
              </p>
              <a 
                href="mailto:eventflow@gmail.com" 
                className="text-2xl font-bold text-[#d4af37] hover:text-[#f4d03f] transition-colors duration-300 tracking-wide border-b border-transparent hover:border-[#d4af37] pb-1"
              >
                eventflow@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        data-section="cta"
        className={`relative px-6 py-24 transition-all duration-1000 delay-500 ${
          visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Decorative top border */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-[#d4af37]" />
            <div className="w-3 h-3 rounded-full bg-[#d4af37] animate-pulse" />
            <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Elevate Your Events?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join the platform trusted by professionals who demand perfection in every detail.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Replaced 'Go to Dashboard' with Login Route */}
            <Link 
              to="/login" 
              className="group relative px-12 py-4 bg-gradient-to-r from-[#d4af37] to-[#C5A46D] text-[#050505] font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d4af37]/30 text-center w-full sm:w-auto"
            >
              <span className="relative z-10 text-lg">Login</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </Link>
            
            {/* Replaced 'Book an Event' with Sign Up Route */}
            <Link 
              to="/register" 
              className="group relative px-12 py-4 bg-transparent border-2 border-[#d4af37] text-[#d4af37] font-bold rounded-lg overflow-hidden transition-all duration-300 hover:bg-[#d4af37] hover:text-[#050505] text-center w-full sm:w-auto"
            >
              <span className="relative z-10 text-lg">Sign Up</span>
            </Link>
          </div>

          {/* Bottom decorative element */}
          <div className="mt-20">
            <div className="inline-block px-8 py-3 border border-[#d4af37]/30 rounded-full bg-[#111]">
              <p className="text-xs md:text-sm text-gray-500 font-bold tracking-widest uppercase">EventFlow · Where Excellence is Standard</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;