"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Link, Crop, CalendarDays, FileText, MinusCircle, Waypoints, Copy, CheckCircle2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function AdminDorks() {
  const navigate = useNavigate();

  const [siteUrl, setSiteUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [fileType, setFileType] = useState('');
  const [exactPhrase, setExactPhrase] = useState('');
  const [excludeTerms, setExcludeTerms] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [additionalOperators, setAdditionalOperators] = useState('');
  const [generatedQuery, setGeneratedQuery] = useState('');

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

    if (width.trim() && height.trim()) {
      queryParts.push(`imagesize:${width}x${height}`);
    }

    if (yearFrom.trim()) {
      queryParts.push(`after:${yearFrom.trim()}-01-01`);
    }
    if (yearTo.trim()) {
      queryParts.push(`before:${yearTo.trim()}-12-31`);
    }

    if (additionalOperators.trim()) {
      queryParts.push(additionalOperators.trim());
    }

    const searchQuery = queryParts.join(' ').trim();

    if (!searchQuery) {
      showError("Preencha pelo menos um campo para gerar a busca.");
      return;
    }

    setGeneratedQuery(searchQuery);
  };

  const handleOpenGoogle = () => {
    if (!generatedQuery) {
      showError("Gere uma busca primeiro.");
      return;
    }
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(generatedQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  const handleOpenGoogleImages = () => {
    if (!generatedQuery) {
      showError("Gere uma busca primeiro.");
      return;
    }
    const googleImagesUrl = `https://www.google.com/search?q=${encodeURIComponent(generatedQuery)}&tbm=isch`;
    window.open(googleImagesUrl, '_blank');
  };

  const handleCopyQuery = () => {
    if (!generatedQuery) return;
    navigator.clipboard.writeText(generatedQuery);
    showSuccess("Query copiada para a área de transferência!");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-10">
        
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white text-xs uppercase tracking-wider font-bold transition-all duration-300 hover:border-zinc-700 hover:scale-[1.02] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Painel Admin</span>
        </button>

        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">ACIOLI.LAB DORKING</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            Encontre Seus Designs no Google
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">
            Utilize operadores de busca avançada para monitorar a presença dos seus designs, criativos e materiais online.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
          
          <form
            onSubmit={(e) => { e.preventDefault(); handleGenerateDork(); }}
            className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8"
          >
            {/* Campo: URL/Domínio */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Link className="w-4 h-4 text-zinc-500" />
                <span>URL ou Domínio (site:)</span>
              </label>
              <input
                type="text"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="Ex: seuwebsite.com ou acioli.lab"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Busca apenas dentro de um domínio específico (sem http:// ou https://).</p>
            </div>

            {/* Campo: Palavras-chave */}
            <div className="space-y-2">
              <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                <Search className="w-4 h-4 text-zinc-500" />
                <span>Palavras-chave</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ex: flyer marketing digital, logo minimalista"
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
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
                placeholder='Ex: minha identidade visual ou portfólio amaro acioli'
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Busca a frase exatamente como digitada.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Tipo de Arquivo */}
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
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
                <p className="text-zinc-500 text-xs mt-1">Filtra por extensões de arquivo.</p>
              </div>

              {/* Excluir Termos */}
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
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
                <p className="text-zinc-500 text-xs mt-1">Termos ou domínios para excluir (Ex: -pinterest.com).</p>
              </div>
            </div>

            {/* Dimensões e Ano */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-zinc-500" />
                  <span>Largura (px)</span>
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Ex: 1920"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-zinc-500" />
                  <span>Altura (px)</span>
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex: 1080"
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-zinc-500" />
                  <span>Ano De (after:)</span>
                </label>
                <input
                  type="number"
                  value={yearFrom}
                  onChange={(e) => setYearFrom(e.target.value)}
                  placeholder="Ex: 2023"
                  min="1990"
                  max={new Date().getFullYear().toString()}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-zinc-500" />
                  <span>Ano Até (before:)</span>
                </label>
                <input
                  type="number"
                  value={yearTo}
                  onChange={(e) => setYearTo(e.target.value)}
                  placeholder="Ex: 2025"
                  min="1990"
                  max={new Date().getFullYear().toString()}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                />
              </div>
            </div>

            {/* Operadores Adicionais */}
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
                className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#00c868]/10 transition-all duration-300 resize-none placeholder:text-zinc-600 text-sm"
              />
              <p className="text-zinc-500 text-xs mt-1">Insira operadores de busca avançada extras para refinar a pesquisa.</p>
            </div>

            {/* Botão Gerar */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Gerar Query de Busca</span>
            </button>

          </form>
        </div>

        {/* Pré-visualização da Query Gerada */}
        {generatedQuery && (
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 to-[#00c868]/10 rounded-3xl opacity-50 blur-sm" />
            <div className="relative bg-zinc-950/90 border-2 border-[#00c868]/30 p-8 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#00c868]/10 border border-[#00c868]/30 rounded-2xl text-[#00c868]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white">Query Gerada com Sucesso!</h3>
                  <div className="mt-3 relative">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 pr-12 font-mono text-sm text-[#00c868] break-all leading-relaxed">
                      {generatedQuery}
                    </div>
                    <button
                      onClick={handleCopyQuery}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-[#00c868] hover:border-[#00c868]/40 transition-all"
                      title="Copiar query"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleOpenGoogle}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#00c868]/10 hover:bg-[#00c868] text-[#00c868] hover:text-black border border-[#00c868]/20 hover:border-[#00c868] font-black text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Abrir no Google</span>
                </button>
                <button
                  onClick={handleOpenGoogleImages}
                  className="flex items-center justify-center gap-3 py-4 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-500 font-black text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                >
                  <Crop className="w-4 h-4" />
                  <span>Abrir no Google Imagens</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}