"use client";

import React, { useState } from 'react';
import { Send, Info, Check } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import ScrollReveal from './ScrollReveal';

export default function AcioliForm() {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    segmento: '',
    whatsapp: '',
    site: '',
    servicosDesejados: ['full-experience'] as string[],
    verbaAnuncio: '800-2k',
    principalDor: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleServico = (val: string) => {
    setFormData(prev => {
      const jaSelecionado = prev.servicosDesejados.includes(val);
      let novosServicos: string[];

      if (jaSelecionado) {
        // Remove da lista
        novosServicos = prev.servicosDesejados.filter(item => item !== val);
      } else {
        // Adiciona à lista
        novosServicos = [...prev.servicosDesejados, val];
      }

      return {
        ...prev,
        servicosDesejados: novosServicos
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.empresa || !formData.segmento || !formData.whatsapp) {
      showError("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    if (formData.servicosDesejados.length === 0) {
      showError("Por favor, selecione pelo menos um serviço de interesse.");
      return;
    }

    setIsLoading(true);

    try {
      const numeroWhats = "5581996345523"; 

      const servicosNomes: Record<string, string> = {
        'design': 'Design & Identidade Premium',
        'video': 'Edição & Captação de Vídeos',
        'trafego': 'Gestão de Tráfego Pago',
        'full-experience': 'Estrutura Completa (Design + Vídeo + Tráfego)'
      };

      const verbasNomes: Record<string, string> = {
        '800-2k': 'R$ 800 a R$ 2.000 / mês',
        '2k-5k': 'R$ 2.000 a R$ 5.000 / mês',
        '5k-10k': 'R$ 5.000 a R$ 10.000 / mês',
        'acima-10k': 'Acima de R$ 10.000 / mês'
      };

      // Formata a lista de serviços selecionados
      const listaServicos = formData.servicosDesejados
        .map(svc => `• ${servicosNomes[svc] || svc}`)
        .join('\n');

      const mensagem = `*NOVO DIAGNÓSTICO — ACIOLI.LAB*

*Nome:* ${formData.nome}
*Empresa:* ${formData.empresa} (${formData.segmento})
*WhatsApp:* ${formData.whatsapp}
*Site/Instagram:* ${formData.site || 'Não informado'}

*Serviços Desejados:*
${listaServicos}

*Verba para Anúncios:* ${verbasNomes[formData.verbaAnuncio] || formData.verbaAnuncio}

*Desafio Principal:*
"${formData.principalDor || 'Não informado.'}"

---
_Enviado através de acioli.lab_`;

      const linkWhats = `https://api.whatsapp.com/send?phone=${numeroWhats}&text=${encodeURIComponent(mensagem)}`;
      
      showSuccess("Redirecionando para o WhatsApp...");
      
      setTimeout(() => {
        window.open(linkWhats, '_blank');
        setIsLoading(false);
      }, 800);

    } catch (err) {
      showError("Ocorreu um erro ao processar. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="py-28 bg-black text-white border-t border-zinc-900 relative">
      
      {/* Luz ambiente de destaque para o formulário se sobressair elegantemente com a nova cor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#00c868]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header explicativo */}
        <ScrollReveal className="max-w-xl mb-16 space-y-4 text-left">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Iniciar diagnóstico</h2>
          <p className="text-zinc-300 text-base font-light leading-relaxed">
            Preencha as informações básicas do seu negócio. Analisaremos os dados detalhadamente antes de iniciar seu atendimento via WhatsApp.
          </p>
        </ScrollReveal>

        {/* Formulário com Moldura Estética Flutuante */}
        <ScrollReveal delay={200}>
          <div className="relative group">
            {/* Efeito Glow Pulsante Traseiro com a cor verde */}
            <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/40 via-zinc-800 to-[#00c868]/20 rounded-3xl opacity-30 blur-sm group-hover:opacity-50 transition-all duration-700 group-hover:duration-300" />
            
            <form 
              onSubmit={handleSubmit} 
              className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-12 border border-zinc-850/80 shadow-[0_30px_70px_rgba(0,0,0,0.95)] space-y-10"
            >
              
              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Seu Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    required
                    placeholder="Como prefere ser chamado?"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-550"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Empresa *</label>
                  <input
                    type="text"
                    name="empresa"
                    required
                    placeholder="Nome da sua empresa ou projeto"
                    value={formData.empresa}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-550"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Segmento *</label>
                  <input
                    type="text"
                    name="segmento"
                    required
                    placeholder="Ex: SaaS, E-commerce, Infoproduto"
                    value={formData.segmento}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-550"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">WhatsApp *</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    required
                    placeholder="DDD + Seu número"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-550"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Site ou Instagram (Opcional)</label>
                  <input
                    type="text"
                    name="site"
                    placeholder="Ex: instagram.com/suamarca"
                    value={formData.site}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-550"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Verba mensal para anúncios</label>
                  <select
                    name="verbaAnuncio"
                    value={formData.verbaAnuncio}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 cursor-pointer"
                  >
                    <option value="800-2k" className="bg-zinc-950 text-white">R$ 800 a R$ 2.000 / mês</option>
                    <option value="2k-5k" className="bg-zinc-950 text-white">R$ 2.000 a R$ 5.000 / mês</option>
                    <option value="5k-10k" className="bg-zinc-950 text-white">R$ 5.000 a R$ 10.000 / mês</option>
                    <option value="acima-10k" className="bg-zinc-950 text-white">Acima de R$ 10.000 / mês</option>
                  </select>
                </div>
              </div>

              {/* Serviço de Interesse - Checkbox Múltiplo */}
              <div className="space-y-4">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Serviços Desejados (Selecione quantos desejar)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: "full-experience", label: "Estrutura Completa" },
                    { value: "design", label: "Design & Identidade Premium" },
                    { value: "video", label: "Edição & Captação de Vídeos" },
                    { value: "trafego", label: "Gestão de Tráfego Pago" },
                  ].map((option) => {
                    const isSelected = formData.servicosDesejados.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        onClick={() => handleToggleServico(option.value)}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 select-none ${
                          isSelected
                            ? 'bg-[#00c868]/10 border-[#00c868] text-white shadow-[0_0_15px_rgba(0,200,104,0.07)] scale-[1.01]'
                            : 'bg-zinc-900/20 border-zinc-850 text-zinc-400 hover:border-zinc-750 hover:bg-zinc-900/30'
                        }`}
                      >
                        {/* Custom Checkbox */}
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isSelected 
                            ? 'bg-[#00c868] border-[#00c868] text-black' 
                            : 'border-zinc-700 bg-zinc-900/60'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                        </div>
                        <span className="text-xs font-bold tracking-wider uppercase">{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Principal Desafio */}
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">Qual o seu principal desafio de vendas hoje?</label>
                <textarea
                  name="principalDor"
                  rows={3}
                  placeholder="Ex: Nossos anúncios antigos saturaram e precisamos de criativos de alto padrão para captar leads qualificados."
                  value={formData.principalDor}
                  onChange={handleChange}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/80 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 resize-none placeholder:text-zinc-550"
                />
              </div>

              <div className="flex gap-3 text-xs text-zinc-400 leading-relaxed font-light">
                <Info className="w-4 h-4 text-[#00c868] shrink-0 mt-0.5" />
                <span>As informações do formulário serão formatadas e enviadas diretamente para a conversa comercial no WhatsApp.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-4 py-6 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <span>Enviar para o WhatsApp</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}