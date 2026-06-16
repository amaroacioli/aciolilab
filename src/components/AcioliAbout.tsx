"use client";

import React from 'react';
import { MapPin, Award, CheckCircle2, Star, Calendar } from 'lucide-react';

export default function AcioliAbout() {
  return (
    <section id="about" className="py-24 bg-slate-950/40 relative border-t border-slate-900">
      <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Coluna Esquerda: Texto e Perfil */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              Fundador & Estrategista
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              A mente criativa por trás do <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Acioli.lab</span>
            </h2>

            <p className="text-slate-400 text-base sm:text-lg font-light leading-relaxed">
              Olá, sou <span className="text-white font-medium">Amaro Acioli</span>, natural de Recife. Atuo há mais de <span className="text-cyan-400 font-medium">5 anos no mercado de marketing e infoprodutos</span> criando estruturas integradas de crescimento digital. 
            </p>

            <p className="text-slate-400 text-base sm:text-lg font-light leading-relaxed">
              O Acioli.lab nasceu da necessidade de entregar para as empresas o que há de mais moderno em design e tecnologia de tráfego, sem enrolação. Nosso foco é posicionamento premium através de design refinado, captação audiovisual cinematográfica e performance otimizada em anúncios.
            </p>

            {/* Fatos rápidos em grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-900">
                <MapPin className="w-5 h-5 text-cyan-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-white font-medium text-sm">Nativo de Recife</h4>
                  <p className="text-slate-500 text-xs">Polo de criatividade e tecnologia digital do Nordeste</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-900">
                <Award className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
                <div>
                  <h4 className="text-white font-medium text-sm">+5 Anos de Experiência</h4>
                  <p className="text-slate-500 text-xs">Liderando estratégias que impactam faturamento de marcas reais</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Caixa Visual minimalista com os pilares */}
          <div className="lg:col-span-5">
            <div className="relative p-8 rounded-3xl bg-gradient-to-b from-slate-900/70 to-slate-950/70 border border-slate-800 shadow-2xl">
              <div className="absolute -top-4 -right-4 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 animate-bounce">
                <Star className="w-6 h-6 fill-cyan-400/20" />
              </div>

              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Nossos Compromissos de Entrega
              </h3>

              <div className="space-y-5">
                {[
                  {
                    title: "Estética Minimalista & Exclusiva",
                    desc: "Fuja dos templates prontos. Sua empresa com design autoral focado em alto padrão visual."
                  },
                  {
                    title: "Audiovisual de Alta Retenção",
                    desc: "Roteirização estratégica de vídeos com edições rápidas que prendem o lead nos primeiros 3 segundos."
                  },
                  {
                    title: "Tráfego Direcionado a Vendas",
                    desc: "Sem métricas de vaidade. Nós focamos na geração de leads qualificados prontos para comprar."
                  },
                  {
                    title: "Atendimento Direto com Especialistas",
                    desc: "Aqui você não fala com robôs. Amaro Acioli coordena diretamente a estratégia do seu projeto."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-3.5 group">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                    <div>
                      <h4 className="text-white text-sm font-semibold">{item.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}