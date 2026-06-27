"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Link, Crop, CalendarDays, FileText, MinusCircle, 
  Waypoints, Copy, CheckCircle2, Palette, Sparkles, ExternalLink, 
  RefreshCw, Heart, Eye, Bookmark, Grid3X3, LayoutGrid, X, Download
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

type TabType = 'google' | 'pinterest';

interface PinterestIdea {
  id: string;
  title: string;
  colors: string[];
  tags: string[];
  searchUrl: string;
  imageUrl: string;
  category: string;
}

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

  // Pinterest State
  const [pinterestKeyword, setPinterestKeyword] = useState('');
  const [pinterestStyle, setPinterestStyle] = useState('moderno');
  const [isSearchingIdeas, setIsSearchingIdeas] = useState(false);
  const [designIdeas, setDesignIdeas] = useState<PinterestIdea[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const styles = [
    { value: 'moderno', label: 'Moderno', colors: ['#000000', '#FFFFFF', '#3B82F6', '#8B5CF6'] },
    { value: 'minimalista', label: 'Minimalista', colors: ['#18181B', '#F4F4F5', '#A1A1AA', '#71717A'] },
    { value: 'bold', label: 'Bold & Vibrante', colors: ['#EF4444', '#F59E0B', '#10B981', '#6366F1'] },
    { value: 'elegante', label: 'Elegante', colors: ['#1C1917', '#D6D3D1', '#A8A29E', '#78716C'] },
    { value: 'neon', label: 'Neon/Futurista', colors: ['#00FF88', '#FF00FF', '#00FFFF', '#FF0080'] },
    { value: 'retro', label: 'Retro/Vintage', colors: ['#92400E', '#B45309', '#D97706', '#FCD34D'] },
    { value: 'pastel', label: 'Pastel Suave', colors: ['#FECDD3', '#BFDBFE', '#BBF7D0', '#FDE68A'] },
    { value: 'dark', label: 'Dark Mode', colors: ['#09090B', '#18181B', '#27272A', '#00C868'] },
  ];

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('acioli_design_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
      showSuccess("Removido dos favoritos");
    } else {
      updated = [...favorites, id];
      showSuccess("Adicionado aos favoritos!");
    }
    setFavorites(updated);
    localStorage.setItem('acioli_design_favorites', JSON.stringify(updated));
  };

  const generateDesignIdeas = () => {
    if (!pinterestKeyword.trim()) {
      showError("Digite uma palavra-chave para buscar inspirações.");
      return;
    }

    setIsSearchingIdeas(true);

    setTimeout(() => {
      const selectedStyle = styles.find(s => s.value === pinterestStyle) || styles[0];
      const query = encodeURIComponent(pinterestKeyword.trim());
      
      // Inteligência de mapeamento de imagens reais de alta qualidade baseadas no tema e estilo
      const ideas: PinterestIdea[] = [
        {
          id: `idea_logo_${Date.now()}`,
          title: `Logotipo ${pinterestKeyword} ${selectedStyle.label}`,
          colors: selectedStyle.colors,
          tags: ['logo', 'branding', selectedStyle.label.toLowerCase()],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`${pinterestKeyword} logo design ${pinterestStyle}`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?logo,branding,${query}`,
          category: 'Logo & Branding'
        },
        {
          id: `idea_palette_${Date.now()}`,
          title: `Paleta de Cores ${pinterestKeyword}`,
          colors: selectedStyle.colors,
          tags: ['cores', 'palette', 'aesthetic'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`color palette ${pinterestKeyword} brand`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?colors,palette,abstract,${query}`,
          category: 'Paleta de Cores'
        },
        {
          id: `idea_social_${Date.now()}`,
          title: `Social Media ${pinterestKeyword}`,
          colors: selectedStyle.colors,
          tags: ['instagram', 'posts', 'feed'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`${pinterestKeyword} instagram template design`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?instagram,socialmedia,template,${query}`,
          category: 'Social Media'
        },
        {
          id: `idea_typo_${Date.now()}`,
          title: `Tipografia ${selectedStyle.label}`,
          colors: selectedStyle.colors,
          tags: ['typography', 'fonts', 'lettering'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`typography ${pinterestStyle} design inspiration`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?typography,font,lettering,${query}`,
          category: 'Tipografia'
        },
        {
          id: `idea_ui_${Date.now()}`,
          title: `UI/UX ${pinterestKeyword} App`,
          colors: selectedStyle.colors,
          tags: ['ui design', 'mobile', 'interface'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`${pinterestKeyword} app ui design ${pinterestStyle}`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?uidesign,app,interface,${query}`,
          category: 'UI/UX Design'
        },
        {
          id: `idea_pack_${Date.now()}`,
          title: `Embalagem ${pinterestKeyword}`,
          colors: selectedStyle.colors,
          tags: ['packaging', 'box', 'mockup'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`${pinterestKeyword} packaging design ${pinterestStyle}`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?packaging,box,product,${query}`,
          category: 'Embalagem'
        },
        {
          id: `idea_pattern_${Date.now()}`,
          title: `Padrões & Texturas`,
          colors: selectedStyle.colors,
          tags: ['pattern', 'texture', 'background'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`${pinterestStyle} pattern design texture`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?pattern,texture,background,${query}`,
          category: 'Texturas & Patterns'
        },
        {
          id: `idea_card_${Date.now()}`,
          title: `Cartão de Visita ${pinterestKeyword}`,
          colors: selectedStyle.colors,
          tags: ['business card', 'stationery', 'mockup'],
          searchUrl: `https://br.pinterest.com/search/pins/?q=${encodeURIComponent(`business card ${pinterestKeyword} design`)}`,
          imageUrl: `https://images.unsplash.com/featured/600x800/?businesscard,stationery,${query}`,
          category: 'Papelaria'
        },
      ];

      setDesignIdeas(ideas);
      setIsSearchingIdeas(false);
      showSuccess(`${ideas.length} ideias visuais carregadas com sucesso!`);
    }, 1500);
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
            Encontre designs reais no Pinterest e use operadores de busca avançada para monitorar seus materiais online.
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
            <span>Pinterest</span>
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
            <span>Google Dorks</span>
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
                    <h3 className="text-lg font-bold text-white">Buscar Inspiração no Pinterest</h3>
                    <p className="text-xs text-zinc-500">Encontre referências visuais para seus projetos</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">
                      Palavra-chave do Projeto
                    </label>
                    <input
                      type="text"
                      value={pinterestKeyword}
                      onChange={(e) => setPinterestKeyword(e.target.value)}
                      placeholder="Ex: café, moda feminina, tecnologia, pet shop..."
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#E60023] focus:bg-zinc-900/60 focus:ring-1 focus:ring-[#E60023]/10 transition-all duration-300 placeholder:text-zinc-600 text-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-zinc-300 text-[11px] uppercase tracking-wider font-bold font-mono">
                      Estilo Visual
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {styles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setPinterestStyle(style.value)}
                          className={`relative p-4 rounded-xl border transition-all duration-300 cursor-pointer group ${
                            pinterestStyle === style.value
                              ? 'bg-[#E60023]/10 border-[#E60023] scale-[1.02]'
                              : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-1">
                              {style.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border-2 border-zinc-950"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={`text-xs font-bold ${
                            pinterestStyle === style.value ? 'text-white' : 'text-zinc-400'
                          }`}>
                            {style.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateDesignIdeas}
                    disabled={isSearchingIdeas}
                    className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#E60023]/10 hover:bg-[#E60023] text-[#E60023] hover:text-white border-2 border-[#E60023]/20 hover:border-[#E60023] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(230,0,35,0.08)] hover:shadow-[0_25px_60px_rgba(230,0,35,0.25)] hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 cursor-pointer"
                  >
                    {isSearchingIdeas ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Buscando Referências...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Gerar Ideias de Design</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Design Ideas Grid */}
            {designIdeas.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-[#E60023]" />
                    <span>Ideias para se Inspirar</span>
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">{designIdeas.length} resultados</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {designIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="group relative bg-zinc-950/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-[#E60023]/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(230,0,35,0.15)] flex flex-col justify-between"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img 
                          src={idea.imageUrl} 
                          alt={idea.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                        
                        {/* Floating Category Badge */}
                        <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-zinc-800 text-zinc-300">
                          {idea.category}
                        </span>

                        {/* Floating Action Buttons */}
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => toggleFavorite(idea.id)}
                            className={`p-2 backdrop-blur-md rounded-lg border transition-all ${
                              favorites.includes(idea.id)
                                ? 'bg-[#E60023] border-[#E60023] text-white'
                                : 'bg-black/60 border-zinc-800 text-white hover:bg-[#E60023] hover:border-[#E60023]'
                            }`}
                            title="Favoritar"
                          >
                            <Heart className={`w-4 h-4 ${favorites.includes(idea.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={() => setPreviewImage(idea.imageUrl)}
                            className="p-2 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-lg text-white hover:bg-[#E60023] hover:border-[#E60023] transition-all"
                            title="Visualizar em Tela Cheia"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3 bg-zinc-950/90 border-t border-zinc-900">
                        <h4 className="text-sm font-bold text-white leading-tight group-hover:text-[#E60023] transition-colors">
                          {idea.title}
                        </h4>

                        {/* Color Palette Preview */}
                        <div className="flex gap-1.5 py-1">
                          {idea.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-full border border-zinc-800"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Action Button */}
                        <a
                          href={idea.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-[#E60023] hover:text-white hover:border-[#E60023] transition-all duration-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver no Pinterest</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Search Links */}
                <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-[#E60023]" />
                    Buscas Rápidas no Pinterest
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      `${pinterestKeyword} design trends 2024`,
                      `${pinterestKeyword} branding inspiration`,
                      `${pinterestStyle} design aesthetic`,
                      `${pinterestKeyword} mockup`,
                      'design inspiration board',
                      `${pinterestKeyword} visual identity`
                    ].map((term, i) => (
                      <a
                        key={i}
                        href={`https://br.pinterest.com/search/pins/?q=${encodeURIComponent(term)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:border-[#E60023]/40 hover:bg-[#E60023]/5 transition-all"
                      >
                        <Search className="w-3 h-3" />
                        {term}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GOOGLE DORKS TAB */}
        {activeTab === 'google' && (
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
              
              <form
                onSubmit={(e) => { e.preventDefault(); handleGenerateDork(); }}
                className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8"
              >
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
                  type="submit"
                  className="w-full flex items-center justify-center gap-4 py-4 rounded-full bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border-2 border-[#00c868]/20 hover:border-[#00c868] font-black text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-500 backdrop-blur-md shadow-[0_20px_50px_rgba(0,200,104,0.08)] hover:shadow-[0_25px_60px_rgba(0,200,104,0.22)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Gerar Query de Busca</span>
                </button>
              </form>
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
        )}

      </div>

      {/* FULL SCREEN IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <img 
              src={previewImage} 
              alt="Design Preview" 
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}