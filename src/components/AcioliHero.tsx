"use client";

import React, { useState } from 'react';
import { ArrowRight, Trophy, Eye, TrendingUp, Sparkles, Instagram, Volume2, VolumeX, Play } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function AcioliHero() {
  const [isMuted, setIsMuted] = useState(true);

  const handleStart = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative pt-32 pb-24 md:pt-44 md:pb-36 bg-black text-white overflow-hidden">
      
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00c868]/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid sutil de fundo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Coluna da Esquerda: Copywriting, Métricas & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-8">
            
            <ScrollReveal delay={100} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#00c868]" />
                <span>Case de Sucesso • Audiovisual & Estratégia</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-white">
                Quer produzir conteúdos{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#00c868] italic font-serif">
                  assim?
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-zinc-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-2xl">
                Estratégias de alto impacto que combinam <span className="text-white font-semibold">audiovisual de retenção</span>, <span className="text-white font-semibold">marca pessoal magnética</span> e <span className="text-[#00c868] font-semibold">campanhas constantes</span> que transformam visualizações em autoridade real de mercado.
              </p>
            </ScrollReveal>

            {/* Grid de Métricas Reais do Case */}
            <ScrollReveal delay={300} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full pt-2">
              
              {/* Métrica 1: Alcance */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-900/90 hover:border-zinc-800 transition-all">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00c868]/10 border border-[#00c868]/20 flex items-center justify-center text-[#00c868]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Alcance Mensal</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  800K a 2M+
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  visualizações orgânicas mensais no perfil
                </p>
              </div>

              {/* Métrica 2: Globo / PEGN */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-900/90 hover:border-zinc-800 transition-all">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Reconhecimento</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Vitória no PEGN (Globo)
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  destaque nacional em rede de televisão
                </p>
              </div>

              {/* Métrica 3: Campanhas e Marca Pessoal */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-900/90 hover:border-zinc-800 transition-all sm:col-span-2">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Presença Forte & Campanhas Recorrentes</h4>
                    <p className="text-xs text-zinc-400">Posicionamento de marca pessoal sólido com narrativa pensada estrategicamente do início ao fim.</p>
                  </div>
                </div>
              </div>

            </ScrollReveal>

            {/* Assinatura Amaro Acioli */}
            <ScrollReveal delay={350} className="w-full">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 max-w-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00c868] animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm text-zinc-300">
                  Direção criativa, roteirização e estratégia pensadas por <span className="text-white font-bold">Amaro Acioli</span>.
                </p>
              </div>
            </ScrollReveal>

            {/* CTAs */}
            <ScrollReveal delay={400} className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                onClick={handleStart}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4.5 rounded-full bg-[#00c868] hover:bg-[#00df74] text-black font-extrabold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_10px_35px_rgba(0,200,104,0.3)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                <span>Quero conteúdos nesse nível</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              
              <a
                href="https://www.instagram.com/p/DdKTsgRsPq7/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-950/70 text-zinc-300 hover:text-white text-xs uppercase tracking-wider font-bold transition-all duration-300 hover:bg-zinc-900 cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-[#00c868]" />
                <span>Ver publicação original</span>
              </a>
            </ScrollReveal>

          </div>

          {/* Coluna da Direita: Player do Vídeo com Moldura High-Tech / iPhone */}
          <div className="lg:col-span-5 flex justify-center items-center w-full">
            <ScrollReveal delay={250} className="relative w-full max-w-[340px] sm:max-w-[370px]">
              
              {/* Glow traseiro do smartphone */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-[#00c868]/20 via-[#00c868]/5 to-cyan-500/20 rounded-[52px] blur-2xl opacity-75 pointer-events-none" />

              {/* Moldura do Aparelho */}
              <div className="relative aspect-[9/18.5] w-full rounded-[44px] border-[7px] border-zinc-850 bg-black p-2 shadow-[0_30px_90px_rgba(0,0,0,0.95)] ring-1 ring-zinc-800">
                
                {/* Dynamic Island */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-3 pointer-events-none border border-zinc-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  <span className="w-3 h-1 bg-zinc-900 rounded-full" />
                </div>

                {/* Tela Interna com o Vídeo do Case em Autoplay */}
                <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-zinc-950 border border-zinc-900 flex flex-col justify-between">
                  
                  {/* Container do Vídeo / Iframe Instagram Oficial */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
                    
                    {/* Iframe oficial do Instagram Reel/Post configurado */}
                    <iframe
                      src="https://www.instagram.com/p/DdKTsgRsPq7/embed"
                      title="Case de Vídeo Instagram - Amaro Acioli"
                      className="w-full h-full border-0 object-cover scale-[1.05] pointer-events-auto"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      loading="eager"
                    />

                  </div>

                  {/* Top Bar Overlay */}
                  <div className="relative z-20 pt-7 px-4 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00c868] animate-pulse" />
                      <span className="text-[11px] font-bold text-white tracking-wide drop-shadow">REEL EM DESTAQUE</span>
                    </div>
                    <a
                      href="https://www.instagram.com/p/DdKTsgRsPq7/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto text-[10px] bg-black/60 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full font-semibold hover:bg-white/20 transition-all flex items-center gap-1"
                    >
                      <Instagram className="w-3 h-3 text-[#00c868]" />
                      <span>Abrir</span>
                    </a>
                  </div>

                  {/* Bottom Tag Overlay */}
                  <div className="relative z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#00c868]/20 border border-[#00c868]/40 flex items-center justify-center text-[#00c868] text-xs font-bold">
                          AA
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">Amaro Acioli</p>
                          <p className="text-[10px] text-zinc-400 leading-tight">Estratégia & Direção Criativa</p>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00c868]/20 text-[#00c868] font-bold border border-[#00c868]/30">
                        +2M Views
                      </span>
                    </div>
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