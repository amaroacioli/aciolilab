"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Link, Crop, CalendarDays, FileText, MinusCircle, Waypoints } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function AdminDorks() {
  const navigate = useNavigate();

  const [siteUrl, setSiteUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [fileType, setFileType] = useState('');
  const [exactPhrase, setExactPhrase] = useState('');
  const [excludeTerms, setExcludeTerms] = useState(''); // New state for exclusion
  const [width, setWidth] = useState(''); // Width for image search
  const [height, setHeight] = useState(''); // Height for image search
  const [year, setYear] = useState(''); // Year for filtering results
  const [additionalOperators, setAdditionalOperators] = useState(''); // For any other custom dorking

  const handleGenerateDork = () => {
    let queryParts: string[] = [];

    if (siteUrl.trim()) {
      queryParts.push(`site:${siteUrl.trim()}`);
    }
    if (keywords.trim()) {
      queryParts.push(keywords.trim());
    }
    if (fileType.trim()) {
      queryParts.push(`filetype:${fileType.trim()}`);
    }
    if (exactPhrase.trim()) {
      queryParts.push(`"${exactPhrase.trim()}"`);
    }
    if (excludeTerms.trim()) {
      excludeTerms.split(',').forEach(term => {
        if (term.trim()) queryParts.push(`-${term.trim()}`);
      });
    }

    // Image-specific dorks (width/height) - primarily work with Google Images, not general web search reliably
    // We can add a note about this or a separate button for image search
    if (width.trim() && height.trim()) {
      queryParts.push(`imagesize:${width}x${height}`);
      showError("A busca por tamanho de imagem (imagesize) é mais eficaz no Google Imagens. Esta busca será geral.");
    }
    
    // Year filtering (best effort as Google's year filtering is usually through advanced search UI or 'after:' / 'before:' operators for dates, not general 'year:')
    if (year.trim()) {
      queryParts.push(`after:${year}-01-01`); // Search results published after the start of the year
      showError("A filtragem por ano é uma estimativa. Considere refinar usando as ferramentas do Google após a busca.");
    }

    if (additionalOperators.trim()) {
      queryParts.push(additionalOperators.trim());
    }

    const searchQuery = queryParts.join(' ').trim();

    if (!searchQuery) {
      showError("Por favor, preencha pelo menos um campo para gerar a busca.");
      return;
    }

    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* Luz ambiente de fundo verde */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-10">
        
        {/* Botão de Voltar para Admin */}
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold transition-all duration-300 hover:border-zinc-700 hover:scale-[1.02] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Painel Admin</span>
        </button>

        {/* Header da Página */}
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">ACIOLI.LAB DORKING</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Encontre Seus Designs no Google
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">
            Utilize operadores de busca avançada para monitorar a presença dos seus designs, criativos e materiais online, filtrando por domínio, tipo de arquivo, palavras-chave e muito mais.
          </p>
        </div>

        {/* Formulário de Dorking */}
        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
          
          <form
            onSubmit={(e) => { e.preventDefault(); handleGenerateDork(); }}
            className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8"
          >
            {/* Campo: URL/Domínio Específico */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Link className="w-4 h-4 text-zinc-500" />
                <span>URL ou Domínio Específico (site:)</span>
              </label>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="Ex: seuwebsite.com ou acioli.lab"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Busca apenas dentro de um domínio específico (não use 'http://' ou 'https://').</p>
            </div>

            {/* Campo: Palavras-chave */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Search className="w-4 h-4 text-zinc-500" />
                <span>Palavras-chave (busca geral)</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: 'flyer marketing digital' ou 'logo minimalista'"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Termos que devem aparecer nos resultados.</p>
            </div>

            {/* Campo: Frase Exata */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span>Frase Exata ("")</span>
              </label>
              <input
                type="text"
                value={exactPhrase}
                onChange={(e) => setExactPhrase(e.target.value)}
                placeholder="Ex: 'minha identidade visual' ou 'portfólio amaro acioli'"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Busca a frase exatamente como digitada.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Campo: Tipo de Arquivo */}
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span>Tipo de Arquivo (filetype:)</span>
                </label>
                <input
                  type="text"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  placeholder="Ex: jpg, png, pdf, mp4"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
                 <p className="text-zinc-500 text-xs mt-1">Filtra por extensões de arquivo.</p>
              </div>

               {/* Campo: Excluir Termos */}
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-zinc-500" />
                  <span>Excluir Termos (-)</span>
                </label>
                <input
                  type="text"
                  value={excludeTerms}
                  onChange={(e) => setExcludeTerms(e.target.value)}
                  placeholder="Ex: pinterest.com, behance.net (separe por vírgula)"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
                <p className="text-zinc-500 text-xs mt-1">Termos ou domínios para CLS (Ex: para remover Pinterest).</p>
              </div>
            </div>

            {/* Campos: Dimensões da Imagem (Apenas Google Imagens) e Ano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-zinc-500" />
                  <span>Largura (px - raramente preciso)</span>
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Ex: 1920"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-zinc-500" />
                  <span>Altura (px - raramente preciso)</span>
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex: 1080"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-zinc-500" />
                  <span>Ano (after:AAAA-MM-DD)</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Ex: 2023"
                  min="1900"
                  max={new Date().getFullYear().toString()}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00```tsx
#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
            </div>

            {/* Campo: Operadores Adicionais */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Waypoints className="w-4 h-4 text-zinc-500" />
                <span>Operadores Adicionais (Avançado)</span>
              </label>
              <textarea
                rows={2}
                value={additionalOperators}
                onChange={(e) => setAdditionalOperators(e.target.value)}
                placeholder="Ex: inurl:blog intext:portfolio (para mais controle)"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 resize-none placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Insira operadores de busca avançada extras para refinar ainda mais a pesquisa.</p>
            </div>

            {/* Botão de Geração de Dork */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Gerar Dork & Abrir no Google</span>
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}