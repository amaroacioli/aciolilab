"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Link, Crop, CalendarDays, FileText, MinusCircle, 
  Waypoints, Copy, CheckCircle2, Palette, Sparkles, ExternalLink, 
  RefreshCw, Grid3X3, LayoutGrid, Layers, FolderHeart, UserCheck
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

type TabType = 'pinterest' | 'google';
type PinterestContentType = 'pins' | 'boards' | 'profiles' | 'all';

export default function AdminDorks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pinterest');

  // Google Dorks State
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

  // Pinterest via Google State
  const [pinterestKeyword, setPinterestKeyword] = useState('');
  const [pinterestStyle, setPinterestStyle] = useState('all');
  const [contentType, setContentType] = useState<PinterestContentType>('pins');
  const [generatedPinterestQuery, setGeneratedPinterestQuery] = useState('');

  const styles = [
    { value: 'all', label: 'Qualquer Estilo' },
    { value: 'minimalista', label: 'Minimalista' },
    { value: 'moderno', label: 'Moderno / Clean' },
    { value: 'bold', label: 'Bold & Vibrante' },
    { value: 'elegante', label: 'Elegante / Premium' },
    { value: 'neon', label: 'Neon / Cyberpunk' },
    { value: 'retro', label: 'Retro / Vintage' },
    { value: 'dark', label: 'Dark Mode' },
  ];

  const contentTypes = [
    { value: 'pins', label: 'Apenas Pins (Imagens)', icon: Layers, desc: 'Foca em pins individuais de design' },
    { value: 'boards', label: 'Pastas Completas (Boards)', icon: FolderHeart, desc: 'Encontra coleções curadas por outros designers' },
    { value: 'profiles', label: 'Perfis de Designers', icon: UserCheck, desc: 'Encontra criadores e agências de elite' },
    { value: 'all', label: 'Todo o Pinterest', icon: Grid3X3, desc: 'Busca geral indexada no domínio' },
  ];

  // Preset Dorks for Designers (Pinterest via Google)
  const designerPresets = [
    {
      title: "Identidades Visuais Completas",
      query: 'site:pinterest.com/pin/ "branding identity" "visual system" -template',
      desc: "Encontra manuais de marca e sistemas de design completos."
    },
    {
      title: "Mockups Premium Gratuitos",
      query: 'site:pinterest.com/pin/ "free mockup" (psd | fig) -pinterest.com/amp/',
      desc: "Filtra mockups reais para Photoshop ou Figma hospedados no Pinterest."
    },
    {
      title: "Paletas de Cores de Tendência",
      query: 'site:pinterest.com/pin/ "color palette" (aesthetic | brand) "hex codes"',
      desc: "Busca paletas de cores profissionais com códigos hexadecimais."
    },
    {
      title: "Grids & Layouts de UI/UX",
      query: 'site:pinterest.com/pin/ "ui design" (dashboard | mobile) "grid layout"',
      desc: "Inspirações de interfaces limpas e estruturadas."
    },
    {
      title: "Tipografias & Combinações",
      query: 'site:pinterest.com/pin/ "font pairing" (serif | sans) "typography"',
      desc: "Combinações de fontes elegantes para títulos e textos."
    },
    {
      title: "Criativos de Alta Conversão",
      query: 'site:pinterest.com/pin/ "ad creative" (facebook | instagram) "design"',
      desc: "Exemplos reais de anúncios de alta performance para tráfego pago."
    }
  ];

  const handleGeneratePinterestDork = () => {
    if (!pinterestKeyword.trim()) {
      showError("Digite uma palavra-chave para gerar a busca.");
      return;
    }

    let queryParts: string[] = [];

    if (contentType === 'pins') {
      queryParts.push('site:pinterest.com/pin/');
    } else if (contentType === 'boards') {
      queryParts.push('site:pinterest.com/board/');
    } else if (contentType === 'profiles') {
      queryParts.push('site:pinterest.com/ -pinterest.com/pin/ -pinterest.com/board/');
    } else {
      queryParts.push('site:pinterest.com');
    }

    queryParts.push(`"${pinterestKeyword.trim()}"`);

    if (pinterestStyle !== 'all') {
      queryParts.push(`"${pinterestStyle}"`);
    }

    queryParts.push('-inurl:amp');

    const finalQuery = queryParts.join(' ');
    setGeneratedPinterestQuery(finalQuery);
    showSuccess("Dork do Pinterest gerado com sucesso!");
  };

  const handleOpenPinterestGoogle = (type: 'web' | 'images', queryText: string) => {
    if (!queryText) {
      showError("Gere a busca primeiro.");
      return;
    }
    const url = type === 'images'
      ? `https://www.google.com/search?q=${encodeURIComponent(queryText)}&tbm=isch`
      : `https://www.google.com/search?q=${encodeURIComponent(queryText)}`;
    window.open(url, '_blank');
  };

  const handleCopyQuery = (queryText: string) => {
    if (!queryText) return;
    navigator.clipboard.writeText(queryText);
    showSuccess("Query copiada para a área de transferência!");
  };

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
    showSuccess("Query gerada com sucesso!");
  };

  const handleOpenGoogle = () => {
    if (!generatedQuery) {
      showError("Gere a busca primeiro.");
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(generatedQuery)}`;
    window.open(url, '_blank');
  };

  const handleOpenGoogleImages = () => {
    if (!generatedQuery) {
      showError("Gere a busca primeiro.");
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(generatedQuery)}&tbm=isch`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00c868]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-10">
        
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
            Inspiração & Busca Avançada
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-light leading-relaxed">
            Use o poder do Google para encontrar designs reais e pastas curadas dentro do Pinterest sem bloqueios.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('pinterest')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'pinterest'
                ? 'bg-[#E60023] text-white shadow-[0_8px_20px_rgba(230,0,35,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Pinterest via Google</span>
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-[#00c868] text-black shadow-[0_8px_20px_rgba(0,200,104,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Google Dorks Geral</span>
          </button>
        </div>

        {/* PINTEREST TAB */}
        {activeTab === 'pinterest' && (
          <div className="space-y-8">
            {/* Search Section */}
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-[#E60023]/30 via-zinc-800 to-[#E60023]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
              
              <div className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#E60023]/10 border border-[#E60023]/30 rounded-2xl">
                    <Palette className="w-6 h-6 text-[#E60023]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Gerador de Dorks do Pinterest</h3>
                    <p className="text-xs text-zinc-500">Filtre o Pinterest usando os operadores de busca do Google para resultados 100% reais</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Palavra-chave */}
                  <div className="space-y-2">
                    <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">
                      O que você quer buscar? (Palavra-chave)
                    </label>
                    <input
                      type="text"
                      value={pinterestKeyword}
                      onChange={(e) => setPinterestKeyword(e.target.value)}
                      placeholder="Ex: café, hamburgueria, landing page, logo..."
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#E60023] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#E60023]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                    />
                  </div>

                  {/* Tipo de Conteúdo */}
                  <div className="space-y-3">
                    <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">
                      Tipo de Conteúdo no Pinterest
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {contentTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = contentType === type.value;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setContentType(type.value as PinterestContentType)}
                            className={`p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer group ${
                              isSelected
                                ? 'bg-[#E60023]/10 border-[#E60023] scale-[1.02]'
                                : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#E60023]' : 'text-zinc-500'}`} />
                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                              {type.label}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1 leading-tight">
                              {type.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Estilo Visual */}
                  <div className="space-y-2">
                    <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">
                      Estilo Visual (Opcional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {styles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setPinterestStyle(style.value)}
                          className={`px-4 py-2 rounded-full border text-xs font-bold transition-all duration-300 cursor-pointer ${
                            pinterestStyle === style.value
                              ? 'bg-[#E60023] border-[#E60023] text-white'
                              : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleGeneratePinterestDork}
                    className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#E60023]/10 hover:bg-[#E60023] text-[#E60023] hover:text-white border-2 border-[#E60023]/20 hover:border-[#E60023] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(230,0,35,0.08)] hover:shadow-[0_25px_60px_rgba(230,0,35,0.25)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Busca do Pinterest</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Pinterest Query Result */}
            {generatedPinterestQuery && (
              <div className="relative group">
                <div className="absolute -inset-px bg-gradient-to-r from-[#E60023]/30 to-[#E60023]/10 rounded-3xl opacity-50 blur-sm" />
                <div className="relative bg-zinc-950/90 border-2 border-[#E60023]/30 p-8 rounded-3xl space-y-6 shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#E60023]/10 border border-[#E60023]/30 rounded-2xl text-[#E60023]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white">Dork do Pinterest Pronto!</h3>
                      <p className="text-xs text-zinc-500 mt-1">Clique nos botões abaixo para abrir os resultados reais indexados pelo Google.</p>
                      
                      <div className="mt-3 relative">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 pr-12 font-mono text-sm text-[#E60023] break-all leading-relaxed">
                          {generatedPinterestQuery}
                        </div>
                        <button
                          onClick={() => handleCopyQuery(generatedPinterestQuery)}
                          className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-[#E60023] hover:border-[#E60023]/40 transition-all"
                          title="Copiar query"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => handleOpenPinterestGoogle('images', generatedPinterestQuery)}
                      className="flex items-center justify-center gap-3 py-4 rounded-xl bg-[#E60023]/10 hover:bg-[#E60023] text-[#E60023] hover:text-white border border-[#E60023]/20 hover:border-[#E60023] font-black text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Abrir no Google Imagens (Recomendado)</span>
                    </button>
                    <button
                      onClick={() => handleOpenPinterestGoogle('web', generatedPinterestQuery)}
                      className="flex items-center justify-center gap-3 py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-black text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir na Busca Web</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Designer Presets Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#E60023]" />
                <h3 className="text-lg font-bold text-white">Dorks Prontos para Designers</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {designerPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-[#E60023]/30 transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white">{preset.title}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">{preset.desc}</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-3 font-mono text-[11px] text-zinc-400 break-all">
                      {preset.query}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleOpenPinterestGoogle('images', preset.query)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E60023]/10 hover:bg-[#E60023] text-[#E60023] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar Imagens</span>
                      </button>
                      <button
                        onClick={() => handleCopyQuery(preset.query)}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Copiar Query"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GOOGLE DORKS TAB */}
        {activeTab === 'google' && (
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
              
              <div className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8">
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
                </div>

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
                </div>

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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                  </div>

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
                  </div>
                </div>

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
                </div>

                <button
                  onClick={handleGenerateDork}
                  className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Gerar Query de Busca</span>
                </button>
              </div>
            </div>

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
                          onClick={() => handleCopyQuery(generatedQuery)}
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
        )}

      </div>
    </div>
  );
}