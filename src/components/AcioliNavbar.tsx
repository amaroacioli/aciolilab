"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function AcioliNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md border-b border-zinc-900 py-3.5' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => scrollToSection('hero')} 
          className="cursor-pointer font-bold tracking-tight text-white text-xl hover:opacity-90 transition-opacity"
        >
          acioli<span className="text-[#00c868] font-light">.lab</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('services')} className="text-zinc-400 hover:text-white text-xs tracking-wider uppercase font-bold transition-colors">Serviços</button>
          <button onClick={() => scrollToSection('cases')} className="text-zinc-400 hover:text-white text-xs tracking-wider uppercase font-bold transition-colors">Cases</button>
          <button onClick={() => scrollToSection('feedbacks')} className="text-zinc-400 hover:text-white text-xs tracking-wider uppercase font-bold transition-colors">Feedbacks</button>
          <button 
            onClick={() => scrollToSection('contact')} 
            className="bg-[#00c868] text-black px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase hover:bg-[#00b05b] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_5px_15px_rgba(0,200,104,0.2)]"
          >
            Contato
          </button>
        </div>

        {/* Mobile button */}
        <div className="md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-zinc-900 px-6 py-6 space-y-4">
          <button onClick={() => scrollToSection('services')} className="block w-full text-left text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold">Serviços</button>
          <button onClick={() => scrollToSection('cases')} className="block w-full text-left text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold">Cases</button>
          <button onClick={() => scrollToSection('feedbacks')} className="block w-full text-left text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold">Feedbacks</button>
          <button onClick={() => scrollToSection('contact')} className="block w-full text-left text-[#00c868] text-xs uppercase tracking-wider font-bold">Contato</button>
        </div>
      )}
    </nav>
  );
}