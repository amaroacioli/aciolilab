"use client";

import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function AcioliHero() {
  const handleStart = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-40 pb-28 md:pt-52 md:pb-40 bg-black text-white overflow-hidden">
      
      {/* Vídeo sutil de fundo com opacidade ideal para textura e movimento de alta qualidade */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-[0.26] filter grayscale contrast-[1.1]"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Camada sutil de gradiente para suavizar as bordas do vídeo para o fundo preto da página */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40" />
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 relative z-10 text-center flex flex-col items-center">
        
        {/* Apresentação do Lab com efeito de revelação */}
        <div className="space-y-8 flex flex-col items-center">
          <ScrollReveal delay={100} className="space-y-6 flex flex-col items-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] text-white max-w-4xl">
              Estrutura completa para o crescimento{' '}
              <span className="inline-block pr-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-[#00c868] italic font-light font-sans">digital</span> da sua empresa.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={250}>
            <p className="text-zinc-300 text-lg sm:text-xl md:text-2xl font-light leading-relaxed max-w-3xl">
              Na <span className="text-white font-semibold">Acioli.lab</span>, impulsionamos marcas de alta performance através de uma trindade estratégica essencial: <span className="text-white font-bold">Design de alta conversão</span>, <span className="text-[#00c868] font-bold">audiovisual de alta retenção</span> e <span className="text-white font-bold">tráfego pago focado em ROI</span>.
            </p>
          </ScrollReveal>

          {/* CTAs Encorpados com Transparência e Peso Visual */}
          <ScrollReveal delay={400} className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 w-full sm:w-auto">
            <button
              onClick={handleStart}
              className="group w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.1)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.3)] hover:scale-[1.04] active:scale-[0.96] cursor-pointer"
            >
              <span>Diagnóstico gratuito</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            
            <button
              onClick={() => {
                document.getElementById('cases')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-12 py-6 rounded-full border border-zinc-800 hover:border-[#00c868]/40 bg-zinc-950/60 text-zinc-400 hover:text-white text-xs sm:text-sm uppercase tracking-widest font-black transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <span>Explorar cases</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </ScrollReveal>
        </div>

      </div>
    </section>
  );
}