"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Tv, ChevronLeft, ChevronRight, Instagram } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

interface VideoItem {
  id: number;
  src: string;
  type: string;
  title: string;
  desc: string;
  tags: string[];
  startTime?: number;
}

export default function AcioliAudiovisual() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const videos: VideoItem[] = [
    {
      id: 1,
      src: "/audiovisual.mp4",
      type: "video/mp4",
      title: "Produção de Alta Retenção",
      desc: "Estruturas dinâmicas com corte rápido de alta retenção visual focados em manter a atenção nos primeiros 3 segundos.",
      tags: ["Roteirização Comercial", "Edição Dinâmica", "Direção de Arte"]
    },
    {
      id: 2,
      src: "/audiovisual2.mp4",
      type: "video/mp4",
      title: "Storytelling & Engajamento",
      desc: "Narrativas autênticas do dia a dia convertidas em peças profissionais com alto engajamento comercial.",
      tags: ["Produção Digital", "Cortes Estratégicos", "Storytelling"],
      startTime: 6
    },
    {
      id: 3,
      src: "/audiovisual3.mp4",
      type: "video/mp4",
      title: "Paralela Cloud AI",
      desc: "Estética futurista desenvolvida para posicionamento premium de tecnologia SaaS, acelerando a conversão de leads frios.",
      tags: ["Estética Futurista", "Comercial SaaS", "Efeitos Visuais"]
    }
  ];

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.load();
      videoElement.muted = true;
      videoElement.playsInline = true;

      const handleCanPlay = () => {
        if (currentVideo.startTime && videoElement.currentTime < currentVideo.startTime) {
          videoElement.currentTime = currentVideo.startTime;
        }
        videoElement.play().catch((err) => console.warn(err));
      };

      const handleEnded = () => {
        videoElement.currentTime = currentVideo.startTime || 0;
        videoElement.play().catch((err) => console.warn(err));
      };

      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.play().catch(() => {});

      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentIndex, currentVideo]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section id="audiovisual" className="py-24 sm:py-32 bg-black text-white border-t border-zinc-900 relative overflow-hidden">
      {/* Efeito Glow Verde de Profundidade */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Header Elegante */}
        <div className="max-w-xl mb-16 space-y-4 text-left">
          <ScrollReveal delay={100}>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Nosso laboratório{' '}
              <span className="inline-block pr-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-[#00c868] italic font-light font-sans">
                audiovisual
              </span>
            </h2>
          </ScrollReveal>
        </div>

        {/* Layout Split-Screen Cinematográfico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LADO ESQUERDO: Player Estilo iPhone / Reels Vertical (Sempre Proporção 9:16) */}
          <div className="lg:col-span-6 flex flex-col items-center w-full relative">
            <ScrollReveal className="w-full max-w-[310px] sm:max-w-[340px] relative">
              
              {/* Moldura de Smartphone Premium */}
              <div 
                className="relative aspect-[9/16] w-full rounded-[42px] overflow-hidden border-[10px] border-zinc-900 bg-zinc-950 p-1 shadow-[0_30px_70px_rgba(0,0,0,0.95)]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Dynamic Island decorativa */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-2.5 pointer-events-none">
                  <span className="w-1 h-1 rounded-full bg-zinc-900" />
                  <span className="w-2.5 h-0.5 bg-zinc-950 rounded-full" />
                </div>

                {/* Player de Vídeo */}
                <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-black">
                  <video 
                    ref={videoRef}
                    muted 
                    playsInline 
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={currentVideo.src} type={currentVideo.type} />
                  </video>

                  {/* Sombras Estéticas Inferiores/Superiores */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50 pointer-events-none z-10" />
                </div>

              </div>

              {/* Controles de Toque no Mobile (Ocultados no PC para usar a Playlist da direita) */}
              <div className="flex sm:hidden absolute top-1/2 -translate-y-1/2 justify-between w-[124%] left-[-12%] z-20 px-2 pointer-events-none">
                <button 
                  onClick={handlePrev}
                  className="p-3 rounded-full bg-zinc-950/90 border border-zinc-850 text-white active:scale-95 transition-all pointer-events-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-3 rounded-full bg-zinc-950/90 border border-zinc-850 text-white active:scale-95 transition-all pointer-events-auto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </ScrollReveal>
          </div>

          {/* LADO DIREITO: Playlist de Seleção Rápida (Desktop Premium) */}
          <div className="lg:col-span-6 space-y-6 w-full text-left">
            <ScrollReveal delay={150} className="space-y-4">
              
              {/* Header da Playlist + Chamada e Link do Instagram */}
              <div className="flex flex-col gap-2 border-b border-zinc-900 pb-5 mb-4">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest font-mono">
                  Selecione um dos nossos filmes para assistir
                </h3>
                
                <a 
                  href="https://www.instagram.com/acioli.lab" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-xs text-[#00c868] hover:text-white transition-colors group mt-1"
                >
                  <Instagram className="w-4 h-4 text-[#00c868] group-hover:scale-110 transition-transform" />
                  <span className="font-light">
                    Tem muito mais no instagram: <strong className="font-semibold text-white underline decoration-[#00c868]/40 underline-offset-2">instagram.com/acioli.lab</strong>
                  </span>
                </a>
              </div>
              
              {/* Lista Vertical de Vídeos */}
              <div className="space-y-4">
                {videos.map((vid, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <div
                      key={vid.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-500 flex items-start gap-5 ${
                        isActive
                          ? 'bg-[#00c868]/10 border-[#00c868] text-white shadow-[0_15px_30px_rgba(0,200,104,0.04)] scale-[1.01]'
                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/20'
                      }`}
                    >
                      {/* Número do Projeto */}
                      <span className={`text-xs font-mono font-bold tracking-wider pt-0.5 ${
                        isActive ? 'text-[#00c868]' : 'text-zinc-650'
                      }`}>
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </span>

                      {/* Info do Projeto */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-base font-bold uppercase tracking-wider ${
                            isActive ? 'text-white' : 'text-zinc-350'
                          }`}>
                            {vid.title}
                          </h4>
                          
                          {/* Indicador Ativo */}
                          {isActive && (
                            <span className="flex items-center gap-1 text-[10px] text-[#00c868] font-bold tracking-widest uppercase font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00c868] animate-ping" />
                              REPRODUZINDO
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-light text-zinc-400 leading-relaxed">
                          {vid.desc}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {vid.tags.map((tag, tIdx) => (
                            <span 
                              key={tIdx} 
                              className={`text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${
                                isActive 
                                  ? 'border-[#00c868]/30 bg-[#00c868]/5 text-[#00c868]' 
                                  : 'border-zinc-900 bg-zinc-950 text-zinc-500'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Dica do Estúdio */}
            <ScrollReveal delay={250} className="pt-4 flex items-center gap-3 text-xs text-zinc-500 leading-relaxed font-light">
              <Tv className="w-4 h-4 text-[#00c868] shrink-0" />
              <span>Navegação tátil habilitada por arraste lateral no mobile e cliques no PC.</span>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
}