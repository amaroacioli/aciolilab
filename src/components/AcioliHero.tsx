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
    <section id="hero" className="relative pt-40 pb-28 md:pt-52 md:pb-36 bg-black text-white overflow-hidden">
      
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

      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">
          
          {/* Apresentação do Amaro e do Lab com efeito de revelação */}
          <div className="lg:col-span-7 space-y-12 text-left">
            <ScrollReveal delay={100} className="space-y-6">
              <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#00c868] font-extrabold font-mono">
                DESIGN & PERFORMANCE AGENCY
              </p>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05] text-white">
                Estrutura completa para o crescimento{' '}
                <span className="inline-block pr-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-[#00c868] italic font-light font-sans">digital</span> da sua empresa.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={250}>
              <p className="text-zinc-300 text-lg sm:text-xl md:text-2xl font-light leading-relaxed max-w-2xl">
                Na <span className="text-white font-semibold">Acioli.lab</span>, impulsionamos marcas de alta performance através de uma trindade estratégica essencial: <span className="text-white font-bold">Design de alta conversão</span>, <span className="text-[#00c868] font-bold">audiovisual de alta retenção</span> e <span className="text-white font-bold">tráfego pago focado em ROI</span>.
              </p>
            </ScrollReveal>

            {/* CTAs Encorpados com Transparência e Peso Visual */}
            <ScrollReveal delay={400} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 pt-4">
              <button
                onClick={handleStart}
                className="group flex items-center justify-center gap-4 px-12 py-6 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.1)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.3)] hover:scale-[1.04] active:scale-[0.96] cursor-pointer shrink-0"
              >
                <span>Diagnóstico gratuito</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
              
              <button
                onClick={() => {
                  document.getElementById('cases')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center justify-center gap-2 px-12 py-6 rounded-full border border-zinc-800 hover:border-[#00c868]/40 bg-zinc-950/60 text-zinc-400 hover:text-white text-xs sm:text-sm uppercase tracking-widest font-black transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <span>Explorar cases</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </ScrollReveal>
          </div>

          {/* Layout da Foto Reestruturado - Com moldura de estúdio flutuante e glow de profundidade */}
          <div className="lg:col-span-5 flex justify-center w-full relative">
            <ScrollReveal delay={300} className="w-full max-w-[420px] sm:max-w-lg relative group">
              
              {/* Efeito Glow de Fundo de acordo com a nova identidade verde */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-zinc-800 to-[#00c868]/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-300" />
              
              {/* Moldura Flutuante */}
              <div className="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden border border-zinc-900 bg-black shadow-[0_30px_70px_rgba(0,0,0,0.98)] transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:border-[#00c868]/30">
                <img 
                  src="/amaro.jpg" 
                  alt="Acioli.lab Team" 
                  className="w-full h-full object-cover object-[center_12%] filter contrast-[1.03] grayscale-[8%] transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Linhas Estéticas Estilo Câmera/Estúdio nos Cantos */}
                <div className="absolute top-6 left-6 w-6 h-6 border-t-2 border-l-2 border-white/20 pointer-events-none group-hover:border-[#00c868]/40 transition-colors duration-300" />
                <div className="absolute top-6 right-6 w-6 h-6 border-t-2 border-r-2 border-white/20 pointer-events-none group-hover:border-[#00c868]/40 transition-colors duration-300" />
                <div className="absolute bottom-6 left-6 w-6 h-6 border-b-2 border-l-2 border-white/20 pointer-events-none group-hover:border-[#00c868]/40 transition-colors duration-300" />
                <div className="absolute bottom-6 right-6 w-6 h-6 border-b-2 border-r-2 border-white/20 pointer-events-none group-hover:border-[#00c868]/40 transition-colors duration-300" />
              </div>

            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}