"use client";

import React from 'react';
import { Quote, Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function AcioliFeedbacks() {
  const feedbacks = [
    {
      text: "Tivemos resultados ótimos desde que iniciamos esta parceria. Ótimo profissional, muito empenhado e pronto a auxiliar e esclarecer dúvidas. Nossa empresa recomenda e aprova seu trabalho, sem dúvidas é de grande interesse para quem deseja ampliar o alcance do seu negócio.",
      author: "Dr. Denilson Assis",
      role: "Advogado, professor e ex-policial rodoviário",
      image: "/denilson.png",
      stars: 5,
    },
    {
      text: "Além de um excelente profissional é bastante solícito e de uma educação ímpar. Recomendo seu trabalho de olhos fechados por conhecer sua integridade e seu empenho em sempre desenvolver com excelência tudo a que se dispõe.",
      author: "Angélica Souza",
      role: "Empresária e Jornalista",
      image: "/angelica.png",
      stars: 5,
    },
    {
      text: "O Acioli é um designer extremamente comprometido e proativo. Entrega sempre além do esperado, com soluções criativas e alinhadas ao que o projeto precisa. Excelente parceiro de trabalho! Tmj",
      author: "Luis Henrique",
      role: "Empresário do ramo EAD",
      image: "/luis.png",
      stars: 5,
    },
    {
      text: "O design do Acioli é de altíssima qualidade. A execução é fiel ao que foi solicitado, sempre com um toque criativo que agrega muito ao resultado final. Uma entrega cuidadosa e profissional, que realmente faz a diferença.",
      author: "Fernando Castro",
      role: "Jornalista, Correspondente Internacional do The Gateway Pundit",
      image: "/fernando.png",
      stars: 5,
    }
  ];

  return (
    <section id="feedbacks" className="py-24 bg-black text-white border-t border-zinc-900 relative overflow-hidden">
      
      {/* Vídeo de Fundo com Mais Presença e Foco no Rosto */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-[0.18] filter grayscale contrast-[1.25] scale-110 object-[center_35%]"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Esfumaçado nas extremidades superior e inferior para mesclar com o fundo preto absoluto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">
        
        {/* Header com efeito de revelação */}
        <ScrollReveal className="max-w-xl mb-16 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#00c868] font-bold font-mono">Reconhecimento</p>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight">Depoimentos de parceiros reais</h2>
        </ScrollReveal>

        {/* Grid de Feedbacks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {feedbacks.map((fb, idx) => (
            <ScrollReveal key={idx} delay={idx * 150}>
              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900/80 backdrop-blur-md hover:border-[#00c868]/30 transition-all duration-300 h-full flex flex-col justify-between space-y-8">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-[#00c868]">
                      {[...Array(fb.stars)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-zinc-850" />
                  </div>

                  <p className="text-zinc-200 text-sm font-light leading-relaxed">
                    "{fb.text}"
                  </p>
                </div>
                
                <div className="pt-6 border-t border-zinc-900/60 flex items-center gap-4">
                  <img 
                    src={fb.image} 
                    alt={fb.author} 
                    className="w-12 h-12 rounded-full object-cover border border-zinc-850 shrink-0 filter contrast-[1.03] grayscale-[15%]" 
                  />
                  <div>
                    <h4 className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                      {fb.author}
                    </h4>
                    <p className="text-zinc-550 text-xs mt-0.5 leading-relaxed">{fb.role}</p>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Métricas Simplificadas com Bold em Informações Críticas */}
        <ScrollReveal delay={200} className="mt-24 pt-12 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-mono">Trajetória de Sucesso</p>
            <p className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-300">
              Experiência de <span className="font-extrabold text-white underline decoration-[#00c868] underline-offset-4">+5 anos</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-mono">Performance Digital</p>
            <p className="text-3xl sm:text-4xl font-light tracking-tight text-zinc-300">
              <span className="font-extrabold text-white underline decoration-[#00c868] underline-offset-4">+ de 2 milhões</span> geridos em anúncios
            </p>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}