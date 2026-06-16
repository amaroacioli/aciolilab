"use client";

import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function AcioliCases() {
  return (
    <section id="cases" className="py-28 bg-black text-white border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header minimalista com fontes pesadas */}
        <ScrollReveal className="max-w-xl mb-20 space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">Resultados Reais</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Projetos em destaque</h2>
        </ScrollReveal>

        {/* Lista de Cases de alta sofisticação */}
        <div className="space-y-28">
          
          {/* Case Drivin */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pt-10 border-t border-zinc-900">
              
              {/* Bloco de Informações */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs text-zinc-550 font-mono tracking-[0.2em] font-bold">CASE 01 / EDTECH & SAAS</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Drivin Sistemas</h3>
                <p className="text-sm text-[#00c868] font-semibold tracking-wide">Marketing & Posicionamento Estratégico Contínuo</p>
                
                <div className="inline-flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-850">
                  <Calendar className="w-4 h-4 text-[#00c868]" />
                  <span>jan de 2022 - mar de 2026</span>
                </div>

                <div className="space-y-4 pt-2 text-zinc-400 text-base sm:text-lg font-light leading-relaxed">
                  <p>
                    Plataforma SaaS consolidada com mais de <span className="text-white font-semibold">500 mil usuários ativos</span>. Atuamos de forma estratégica no fortalecimento da presença digital e do posicionamento de marca da Drivin.
                  </p>
                  <p className="text-sm text-zinc-550">
                    Fomos responsáveis pela produção de conteúdo estratégico avançado e direcionamento de design, alinhando informação técnica de alta qualidade a uma comunicação visual limpa e atrativa que estreita a relação com seu público de autoescolas e trânsito.
                  </p>
                </div>
              </div>

              {/* Banner/Mockup da Marca - Fundo Azul Corporativo Oficial com Logo Branca */}
              <div className="lg:col-span-7">
                <div className="relative group overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e529a] p-16 sm:p-24 flex items-center justify-center min-h-[300px] sm:min-h-[400px] shadow-[0_20px_50px_rgba(14,82,154,0.15)] transition-all duration-700 hover:scale-[1.01] hover:border-[#00c868]/40">
                  
                  {/* Grid de background sutil */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />
                  
                  {/* Filtro brightness para deixar a logo branca por cima do fundo */}
                  <img 
                    src="/drivin-logo.png" 
                    alt="Drivin Sistemas" 
                    className="relative z-10 w-full max-w-[320px] object-contain filter brightness-0 invert transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Linhas Estéticas do Grid nos cantos */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20" />
                </div>
              </div>

            </div>
          </ScrollReveal>

          {/* Case Paralela.net */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pt-16 border-t border-zinc-900">
              
              {/* Bloco de Informações */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs text-zinc-550 font-mono tracking-[0.2em] font-bold">CASE 02 / TECH & CLOUD</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Paralela.net</h3>
                <p className="text-sm text-[#00c868] font-semibold tracking-wide">Cloud VPS & Hospedagem de Alta Performance</p>
                
                <div className="inline-flex items-center gap-2 text-xs text-[#00c868] bg-[#00c868]/10 px-4 py-2 rounded-full border border-[#00c868]/30">
                  <TrendingUp className="w-4 h-4" />
                  <span>+60% de crescimento em receita</span>
                </div>

                <div className="space-y-4 pt-2 text-zinc-400 text-base sm:text-lg font-light leading-relaxed">
                  <p>
                    Empresa focada em soluções robustas de <span className="text-white font-semibold">Cloud VPS de alto desempenho</span>, servidores dedicados e hospedagem ágil para programadores, e-commerces e agências digitais.
                  </p>
                  <p className="text-sm text-zinc-550">
                    Desenvolvemos um repositório de criativos modernos e autônomos por meio do ecossistema do Acioli.lab e estruturamos <span className="text-zinc-300 font-bold">campanhas de tráfego pago altamente direcionadas</span>, otimizando o custo de aquisição (CAC) e <span className="text-zinc-350 font-bold">alavancando a receita recorrente</span> de maneira previsível.
                  </p>
                </div>
              </div>

              {/* Banner/Mockup da Marca - Fundo Deep Violet Server Cloud com Logo Branca */}
              <div className="lg:col-span-7">
                <div className="relative group overflow-hidden rounded-2xl border border-zinc-850 bg-gradient-to-br from-[#050515] to-[#120a2e] p-16 sm:p-24 flex items-center justify-center min-h-[300px] sm:min-h-[400px] shadow-[0_20px_50px_rgba(18,10,46,0.5)] transition-all duration-700 hover:scale-[1.01] hover:border-[#00c868]/40">
                  
                  {/* Glow decorativo de fundo de servidor */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-[#00c868]/5 rounded-full blur-[80px]" />
                  
                  {/* Grid de background sutil */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
                  
                  <img 
                    src="/paralela-logo.png" 
                    alt="Paralela.net Cloud" 
                    className="relative z-10 w-full max-w-[280px] object-contain filter brightness-100 transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Linhas Estéticas nos cantos */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/10" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/10" />
                </div>
              </div>

            </div>
          </ScrollReveal>

        </div>

      </div>
    </section>
  );
}