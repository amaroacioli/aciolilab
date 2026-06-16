"use client";

import React from 'react';
import ScrollReveal from './ScrollReveal';

export default function AcioliServices() {
  const services = [
    {
      num: "01",
      title: "Design de Elite & Branding",
      description: (
        <>
          Identidades visuais <span className="font-bold text-white">exclusivas</span>, landing pages com <span className="font-bold text-white">alta taxa de conversão</span> e peças corporativas desenhadas para posicionar sua marca em um patamar <span className="font-bold text-[#00c868]">premium de valor</span>.
        </>
      )
    },
    {
      num: "02",
      title: "Edição & Captação de Vídeos",
      description: (
        <>
          Roteirização comercial, vídeos de <span className="font-bold text-[#00c868]">alta retenção</span> para redes sociais, Reels e VSLs estruturadas de forma limpa para <span className="font-bold text-white">reter o público</span> nos primeiros segundos.
        </>
      )
    },
    {
      num: "03",
      title: "Tráfego Pago Especializado",
      description: (
        <>
          Planejamento e <span className="font-bold text-white">gestão estratégica</span> de orçamentos no Meta Ads e Google Ads, direcionando as campanhas diretamente para <span className="font-bold text-[#00c868]">aquisição de leads</span> e clientes qualificados.
        </>
      )
    }
  ];

  return (
    <section id="services" className="py-24 bg-black text-white border-t border-zinc-900">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
        
        {/* Header editorial minimalista */}
        <ScrollReveal className="max-w-xl mb-16 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#00c868] font-bold font-mono">Método Integrado</p>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight">
            Como atuamos na jornada de escala da sua empresa
          </h2>
        </ScrollReveal>

        {/* Lista de serviços elegante estilo estúdio */}
        <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
          {services.map((svc, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div 
                className="grid grid-cols-1 md:grid-cols-12 gap-6 py-10 items-start group hover:bg-zinc-900/10 transition-all duration-300 px-2 rounded-sm"
              >
                {/* Número */}
                <div className="md:col-span-1 text-zinc-600 group-hover:text-[#00c868] text-sm font-mono transition-colors duration-300">
                  {svc.num}
                </div>

                {/* Título */}
                <div className="md:col-span-5 text-lg font-normal text-zinc-200 group-hover:text-white transition-colors">
                  {svc.title}
                </div>

                {/* Descrição */}
                <div className="md:col-span-6 text-zinc-400 text-sm leading-relaxed font-light">
                  {svc.description}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

      </div>
    </section>
  );
}