"use client";

import React from 'react';
import AcioliNavbar from '@/components/AcioliNavbar';
import AcioliHero from '@/components/AcioliHero';
import AcioliServices from '@/components/AcioliServices';
import AcioliCases from '@/components/AcioliCases';
import AcioliAudiovisual from '@/components/AcioliAudiovisual';
import AcioliFeedbacks from '@/components/AcioliFeedbacks';
import AcioliInstagram from '@/components/AcioliInstagram';
import AcioliForm from '@/components/AcioliForm';
import { Shield } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white">
      {/* Barra de Navegação Premium */}
      <AcioliNavbar />

      {/* Hero Section - Apresentação direta de Amaro Acioli + Foto */}
      <AcioliHero />

      {/* Pilares & Serviços */}
      <AcioliServices />

      {/* Cases de Sucesso (Drivin Sistemas e Paralela.net) */}
      <AcioliCases />

      {/* Seção de Audiovisual e Retenção Premium */}
      <AcioliAudiovisual />

      {/* Feedbacks de Clientes */}
      <AcioliFeedbacks />

      {/* Formulário de Anamnese Estruturado para o WhatsApp */}
      <AcioliForm />

      {/* Hero Me Acompanhe no Instagram (Seção Final) */}
      <AcioliInstagram />

      {/* Footer Minimalista e Elegante */}
      <footer className="bg-black border-t border-zinc-900 py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start pb-12 border-b border-zinc-900">
            
            {/* Coluna 1: Logo e Slogan */}
            <div className="md:col-span-6 space-y-4">
              <span className="font-medium text-lg text-white">
                acioli<span className="text-zinc-400 font-light">.lab</span>
              </span>
              <p className="text-zinc-500 text-sm font-light max-w-sm leading-relaxed">
                Design autoral de alto nível, captação/edição estratégica de vídeos e tráfego pago focado em resultados tangíveis.
              </p>
            </div>

            {/* Coluna 2: Navegação Rápida */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-white text-xs font-medium uppercase tracking-wider font-mono">Navegação</h4>
              <ul className="space-y-2 text-xs text-zinc-500">
                <li><button onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Quem Sou</button></li>
                <li><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Serviços</button></li>
                <li><button onClick={() => document.getElementById('cases')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Cases</button></li>
                <li><button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Contato</button></li>
              </ul>
            </div>

            {/* Coluna 3: Proposta */}
            <div className="md:col-span-3 space-y-3.5">
              <h4 className="text-white text-xs font-medium uppercase tracking-wider font-mono">Localização</h4>
              <p className="text-zinc-500 text-xs font-light leading-relaxed">
                Atuando de Recife, PE para projetos de alta ambição digital em todo o Brasil.
              </p>
            </div>

          </div>

          {/* Sub-rodapé */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600 font-light">
            <p>© {new Date().getFullYear()} acioli.lab. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-600" />
              <span>Conexão direta segura via WhatsApp.</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}