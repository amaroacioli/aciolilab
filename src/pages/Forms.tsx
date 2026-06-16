"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Calendar, HelpCircle, CheckCircle2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function Forms() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    segmento: '',
    publicoAlvo: '',
    produtoMaisVendido: '',
    disponibilidadeMeet: 'manha', // manha, tarde, noite, qualquer
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.segmento || !formData.publicoAlvo || !formData.produtoMaisVendido) {
      showError("Por favor, preencha todos os campos do formulário.");
      return;
    }

    setIsLoading(true);

    try {
      const numeroWhats = "5581996345523";

      const disponibilidades: Record<string, string> = {
        'manha': 'Período da Manhã (09h às 12h)',
        'tarde': 'Período da Tarde (14h às 18h)',
        'noite': 'Período da Noite (18h às 21h)',
        'qualquer': 'Qualquer horário / Flexível'
      };

      const mensagem = `*NOVO QUESTIONÁRIO DE BRIEFING — ACIOLI.LAB*

*1. Nome do Lead:*
${formData.nome}

*2. Segmento de Atuação:*
${formData.segmento}

*3. Público-Alvo da Empresa:*
"${formData.publicoAlvo}"

*4. Produto mais vendido:*
${formData.produtoMaisVendido}

*5. Disponibilidade para marcar um Meet:*
${disponibilidades[formData.disponibilidadeMeet] || formData.disponibilidadeMeet}

---
_Formulário enviado via acioli.lab/forms_`;

      const linkWhats = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(mensagem)}`;

      showSuccess("Briefing gerado com sucesso! Redirecionando para o WhatsApp...");

      setTimeout(() => {
        window.open(linkWhats, '_blank');
        setIsLoading(false);
      }, 1000);

    } catch (err) {
      showError("Erro ao processar as informações. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white relative overflow-hidden py-16 px-4 sm:px-6">
      
      {/* Luz ambiente de fundo verde */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 space-y-10">
        
        {/* Botão de Voltar para Home */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold transition-all duration-300 hover:border-zinc-700 hover:scale-[1.02] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Site</span>
        </button>

        {/* Header da Página */}
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">ACIOLI.LAB BRIEFING</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Questionário de Diagnóstico
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">
            Responda às perguntas abaixo para que possamos entender os pilares e a maturidade comercial da sua marca antes do nosso contato.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
          
          <form
            onSubmit={handleSubmit}
            className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8"
          >
            {/* Campo 1: Nome */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <span>1. Seu Nome Completo / Empresa</span>
                <span className="text-[#00c868]">*</span>
              </label>
              <input
                type="text"
                name="nome"
                required
                placeholder="Ex: Amaro Acioli"
                value={formData.nome}
                onChange={handleChange}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
            </div>

            {/* Campo 2: Segmento de Atuação */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <span>2. Segmento de Atuação</span>
                <span className="text-[#00c868]">*</span>
              </label>
              <input
                type="text"
                name="segmento"
                required
                placeholder="Ex: E-commerce de Moda, Mentorias, SaaS de Logística"
                value={formData.segmento}
                onChange={handleChange}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
            </div>

            {/* Campo 3: Público-Alvo */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <span>3. Público-alvo da empresa</span>
                <span className="text-[#00c868]">*</span>
              </label>
              <textarea
                name="publicoAlvo"
                required
                rows={3}
                placeholder="Quem são seus compradores? Ex: Donos de transportadoras de pequeno porte, entre 30 e 50 anos."
                value={formData.publicoAlvo}
                onChange={handleChange}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 resize-none placeholder:text-zinc-600 text-sm leading-relaxed"
              />
            </div>

            {/* Campo 4: Produto Mais Vendido */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <span>4. Produto ou Serviço mais vendido hoje</span>
                <span className="text-[#00c868]">*</span>
              </label>
              <input
                type="text"
                name="produtoMaisVendido"
                required
                placeholder="Ex: Plano de assinatura anual ou Mentoria de Negócios X"
                value={formData.produtoMaisVendido}
                onChange={handleChange}
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
            </div>

            {/* Campo 5: Disponibilidade para Meet */}
            <div className="space-y-3">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <span>5. Melhor período para agendarmos um Meet de Alinhamento</span>
                <span className="text-[#00c868]">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { value: 'manha', label: 'Manhã', desc: '09h às 12h' },
                  { value: 'tarde', label: 'Tarde', desc: '14h às 18h' },
                  { value: 'noite', label: 'Noite', desc: '18h às 21h' },
                  { value: 'qualquer', label: 'Qualquer Horário', desc: 'Serei flexível' },
                ].map((item) => {
                  const isSelected = formData.disponibilidadeMeet === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={() => setFormData(prev => ({ ...prev, disponibilidadeMeet: item.value }))}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-300 select-none ${
                        isSelected
                          ? 'bg-[#00c868]/10 border-[#00c868] text-white'
                          : 'bg-zinc-900/20 border-zinc-850 text-zinc-400 hover:border-zinc-750'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-[#00c868] bg-[#00c868]' : 'border-zinc-700 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 text-xs text-zinc-400 leading-relaxed font-light pt-2">
              <CheckCircle2 className="w-4 h-4 text-[#00c868] shrink-0 mt-0.5" />
              <span>Sua resposta será formatada de forma profissional antes de ser encaminhada para o nosso WhatsApp comercial.</span>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-4 py-6 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <span>Enviar Briefing</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}