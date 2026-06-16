"use client";

import React, { useState, useEffect } from 'react';
import { Instagram, ArrowRight, Play } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function AcioliInstagram() {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCTA(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="instagram" className="py-28 bg-black text-white border-t border-zinc-900 relative overflow-hidden">
      {/* Efeito luminoso de fundo verde sutil para profundidade premium */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Lado Esquerdo - Chamada Editorial */}
          <div className="lg:col-span-6 space-y-8 text-left flex flex-col items-start justify-center">
            <ScrollReveal className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">Conexão Diária</p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Me acompanhe no <span className="inline-block pr-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-[#00c868] italic font-light font-sans">Instagram</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <p className="text-zinc-400 text-lg font-light leading-relaxed max-w-lg">
                No meu perfil pessoal e no do laboratório, compartilho <span className="font-bold text-white">registros reais do cotidiano</span> e os bastidores práticos de tudo o que produzimos.
              </p>
            </ScrollReveal>

            {/* Perfis de Instagram Interativos */}
            <ScrollReveal delay={250} className="space-y-4 pt-4 w-full">
              
              {/* Perfil Amaro Acioli - Verde */}
              <a
                href="https://www.instagram.com/amaroacioli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-2xl bg-zinc-950/50 border border-zinc-900 hover:border-[#00c868]/40 hover:bg-[#00c868]/5 transition-all duration-300 group w-full max-w-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:bg-[#00c868]/10 group-hover:border-[#00c868]/20 transition-all">
                    <Instagram className="w-6 h-6 text-[#00c868]" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-bold text-lg">@amaroacioli</h4>
                    <p className="text-zinc-500 text-xs tracking-wider uppercase font-mono mt-0.5">Fundador & Diretor Criativo</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-650 group-hover:text-[#00c868] transition-colors group-hover:translate-x-1" />
              </a>

              {/* Perfil Acioli.lab - Ciano Destacado */}
              <a
                href="https://www.instagram.com/acioli.lab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-2xl bg-zinc-950/50 border border-zinc-900 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 group w-full max-w-md"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all">
                    <Instagram className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-bold text-lg">@acioli.lab</h4>
                    <p className="text-zinc-500 text-xs tracking-wider uppercase font-mono mt-0.5">Cases & Portfólio Oficial</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-650 group-hover:text-cyan-400 transition-colors group-hover:translate-x-1" />
              </a>

            </ScrollReveal>
          </div>

          {/* Lado Direito - Mockup do iPhone Realista com Interface Simulado do Instagram */}
          <div className="lg:col-span-6 flex justify-center items-center w-full">
            <ScrollReveal delay={200} className="relative">
              
              {/* Brilho traseiro sofisticado do telefone */}
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-zinc-850 to-[#00c868]/15 rounded-[48px] blur-2xl opacity-60 pointer-events-none" />

              {/* Corpo de Luxo do iPhone */}
              <div className="relative w-[310px] sm:w-[325px] aspect-[9/19] rounded-[48px] border-[10px] border-zinc-900 bg-zinc-950 p-2.5 shadow-[0_35px_80px_rgba(0,0,0,0.95)]">
                
                {/* Linha Metálica nas laterais */}
                <div className="absolute inset-0 rounded-[38px] border border-zinc-800/85 pointer-events-none" />
                
                {/* Dynamic Island Avançada */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-3 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  <span className="w-3.5 h-1 bg-zinc-950 rounded-full" />
                </div>

                {/* Tela do Telefone rodando a UI Simulado Premium do Instagram */}
                <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between text-white border border-zinc-900/60 font-sans">
                  
                  {/* Vídeo Inteiro de Fundo */}
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className={`absolute inset-0 w-full h-full object-cover object-[center_35%] transition-all duration-[1200ms] ${
                      showCTA ? 'opacity-20 scale-105 filter blur-[2px]' : 'opacity-100 scale-100'
                    }`}
                  >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                  </video>

                  {/* Overlay Escurecido e Degradê Superior/Inferior do Player */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-10" />

                  {/* Top Bar (Status do iOS) */}
                  <div className="h-10 pt-4 px-6 flex justify-between items-center text-[11px] font-semibold text-zinc-400 select-none relative z-20">
                    <span>12:30</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3.5 h-2 border border-zinc-400 rounded-sm p-0.5 flex items-center"><div className="w-full h-full bg-zinc-400 rounded-2xs" /></div>
                    </div>
                  </div>

                  {/* Selo de Vídeo Reproduzindo (Canto Inferior Esquerdo) */}
                  <div className={`absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-700 ${
                    showCTA ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'
                  }`}>
                    <Play className="w-2.5 h-2.5 text-[#00c868] fill-current" />
                    <span className="text-zinc-300">Bastidores lab</span>
                  </div>

                  {/* Overlay do Botão e Chamada de Ação após 5 segundos */}
                  <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center transition-all duration-[1000ms] ${
                    showCTA ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}>
                    <div className="p-4 bg-[#00c868]/15 border border-[#00c868]/30 rounded-full mb-4">
                      <Instagram className="w-8 h-8 text-[#00c868]" />
                    </div>
                    <h4 className="text-white font-extrabold text-lg mb-2">Acompanhe no Instagram</h4>
                    <p className="text-zinc-400 text-xs mb-6 max-w-[200px] leading-relaxed">
                      Assista aos bastidores e novos projetos diariamente.
                    </p>
                    
                    <a
                      href="https://www.instagram.com/amaroacioli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_10px_20px_rgba(0,200,104,0.3)]"
                    >
                      <span>Seguir @amaroacioli</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                </div>
              </div>

            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}