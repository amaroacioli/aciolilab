"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Search, Filter, Trash2, Copy, ExternalLink, 
  Download, RefreshCw, ShieldAlert, Check, Info, Lock, User, 
  LogOut, ArrowLeft, Globe, Phone, MapPin, Star, Calendar, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import ScrollReveal from '@/components/ScrollReveal';

// Interface for the RadarLocal Lead
interface RadarLead {
  id: string;
  nome: string;
  segmento: string;
  segmento_pesquisado: string;
  telefone: string;
  endereco: string;
  website: string;
  tem_website: boolean;
  status_site: string;
  rating: string;
  origem: string;
  google_maps_url: string;
  coletado_em: string;
  observacao?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data States
  const [leads, setLeads] = useState<RadarLead[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('todos');
  const [websiteFilter, setWebsiteFilter] = useState<'todos' | 'sem_site' | 'com_site'>('todos');
  const [phoneFilter, setPhoneFilter] = useState<'todos' | 'com_telefone' | 'sem_telefone'>('todos');

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('acioli_admin_auth') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
      // Load saved leads from localStorage
      const saved = localStorage.getItem('radar_local_leads');
      if (saved) {
        try {
          setLeads(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar leads do localStorage", e);
        }
      }
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'acioli' && password === 'Aliens343*') {
      sessionStorage.setItem('acioli_admin_auth', 'true');
      setIsAuthenticated(true);
      showSuccess("Acesso autorizado com sucesso!");
    } else {
      setLoginError("Usuário ou senha incorretos.");
      showError("Credenciais inválidas.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('acioli_admin_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    showSuccess("Sessão encerrada.");
  };

  // Handle JSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(json)) {
          showError("O arquivo JSON deve conter uma lista de leads.");
          return;
        }

        // Validate and normalize structure
        const validatedLeads: RadarLead[] = json.map((item: any, index: number) => ({
          id: item.id || `lead_${Date.now()}_${index}`,
          nome: item.nome || item.name || "Sem nome",
          segmento: item.segmento || item.segment || "Não informado",
          segmento_pesquisado: item.segmento_pesquisado || "Geral",
          telefone: item.telefone || item.phone || "Não informado",
          endereco: item.endereco || item.address || "Não informado",
          website: item.website || "",
          tem_website: item.tem_website !== undefined ? item.tem_website : !!item.website,
          status_site: item.status_site || (item.website ? "Com site" : "Sem site"),
          rating: item.rating || "Não avaliado",
          origem: item.origem || "Google Maps",
          google_maps_url: item.google_maps_url || "",
          coletado_em: item.coletado_em || new Date().toISOString().split('T')[0],
          observacao: item.observacao || ""
        }));

        setLeads(validatedLeads);
        localStorage.setItem('radar_local_leads', JSON.stringify(validatedLeads));
        showSuccess(`${validatedLeads.length} leads importados com sucesso!`);
      } catch (err) {
        showError("Erro ao ler o arquivo JSON. Verifique a formatação.");
      }
    };
    reader.readAsText(file);
  };

  // Clear all imported data
  const handleClearData = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados importados? Esta ação não pode ser desfeita.")) {
      setLeads([]);
      localStorage.removeItem('radar_local_leads');
      showSuccess("Todos os dados foram limpos.");
    }
  };

  // Update observation for a specific lead
  const handleUpdateObservation = (id: string, text: string) => {
    const updated = leads.map(lead => {
      if (lead.id === id) {
        return { ...lead, observacao: text };
      }
      return lead;
    });
    setLeads(updated);
    localStorage.setItem('radar_local_leads', JSON.stringify(updated));
  };

  // Copy text helper
  const copyText = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  // Export filtered leads to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      showError("Nenhum lead disponível para exportar.");
      return;
    }

    const headers = [
      "ID", "Nome", "Segmento", "Segmento Pesquisado", "Telefone", 
      "Endereco", "Website", "Tem Website", "Status do Site", 
      "Avaliacao", "Origem", "Google Maps URL", "Coletado Em", "Observacao"
    ];

    const rows = filteredLeads.map(lead => [
      lead.id,
      `"${lead.nome.replace(/"/g, '""')}"`,
      `"${lead.segmento.replace(/"/g, '""')}"`,
      `"${lead.segmento_pesquisado.replace(/"/g, '""')}"`,
      `"${lead.telefone}"`,
      `"${lead.endereco.replace(/"/g, '""')}"`,
      `"${lead.website}"`,
      lead.tem_website ? "Sim" : "Nao",
      `"${lead.status_site}"`,
      `"${lead.rating}"`,
      `"${lead.origem}"`,
      `"${lead.google_maps_url}"`,
      `"${lead.coletado_em}"`,
      `"${(lead.observacao || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `radar_local_leads_filtrados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("CSV exportado com sucesso!");
  };

  // Get unique segments for filter dropdown
  const uniqueSegments = Array.from(new Set(leads.map(l => l.segmento))).filter(Boolean);

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = selectedSegment === 'todos' || lead.segmento === selectedSegment;
    
    const matchesWebsite = websiteFilter === 'todos' || 
      (websiteFilter === 'sem_site' && !lead.tem_website) || 
      (websiteFilter === 'com_site' && lead.tem_website);

    const hasPhone = lead.telefone && lead.telefone !== 'Não informado' && lead.telefone.trim() !== '';
    const matchesPhone = phoneFilter === 'todos' || 
      (phoneFilter === 'com_telefone' && hasPhone) || 
      (phoneFilter === 'sem_telefone' && !hasPhone);

    return matchesSearch && matchesSegment && matchesWebsite && matchesPhone;
  });

  // Dashboard Stats
  const totalLeads = leads.length;
  const totalSemSite = leads.filter(l => !l.tem_website).length;
  const totalComSite = leads.filter(l => l.tem_website).length;
  const totalComTelefone = leads.filter(l => l.telefone && l.telefone !== 'Não informado' && l.telefone.trim() !== '').length;
  
  // Get unique searched segments
  const uniqueSearchedSegments = Array.from(new Set(leads.map(l => l.segmento_pesquisado))).filter(Boolean);

  // If not authenticated, render the login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00c868]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative group z-10">
          <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
          
          <div className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <div 
                onClick={() => navigate('/')} 
                className="cursor-pointer font-bold tracking-tight text-white text-2xl hover:opacity-90 transition-opacity inline-block"
              >
                acioli<span className="text-[#00c868] font-light">.lab</span>
              </div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono font-bold">RadarLocal • Login</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400 text-center font-medium">
                  {loginError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Usuário</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border border-[#00c868]/20 hover:border-[#00c868] font-black text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Acessar RadarLocal</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-zinc-500 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-white/10 selection:text-white relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00c868]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-900 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">RADARLOCAL</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Painel de Prospecção Comercial
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Importe, visualize e filtre leads comerciais gerados pelo script Python do RadarLocal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair / Logout</span>
            </button>
          </div>
        </div>

        {/* Import Section & Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Import Box */}
          <div className="lg:col-span-4 bg-zinc-950/60 border border-zinc-900 p-6 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00c868]" />
                Importar Arquivo JSON
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Selecione o arquivo <code className="text-zinc-300 font-mono bg-zinc-900 px-1 py-0.5 rounded">.json</code> gerado pelo script Python do RadarLocal para carregar os leads.
              </p>
            </div>

            <div className="relative border-2 border-dashed border-zinc-800 hover:border-[#00c868]/40 rounded-2xl p-6 text-center transition-all group cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="w-8 h-8 text-zinc-600 group-hover:text-[#00c868] mx-auto mb-2 transition-colors" />
              <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors block">
                Clique para selecionar o arquivo
              </span>
              <span className="text-[10px] text-zinc-600 block mt-1">
                Apenas arquivos .json válidos
              </span>
            </div>

            {leads.length > 0 && (
              <button
                onClick={handleClearData}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Dados Importados</span>
              </button>
            )}
          </div>

          {/* Stats Dashboard */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Total de Leads</p>
              <p className="text-3xl sm:text-4xl font-black text-white mt-2">{totalLeads}</p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider text-red-400">Sem Website</p>
              <p className="text-3xl sm:text-4xl font-black text-red-400 mt-2">{totalSemSite}</p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider text-[#00c868]">Com Website</p>
              <p className="text-3xl sm:text-4xl font-black text-[#00c868] mt-2">{totalComSite}</p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider text-blue-400">Com Telefone</p>
              <p className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">{totalComTelefone}</p>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between col-span-2">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Segmentos Pesquisados</p>
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-16 overflow-y-auto">
                {uniqueSearchedSegments.length > 0 ? (
                  uniqueSearchedSegments.map((seg, idx) => (
                    <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {seg}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-600 italic">Nenhum segmento importado</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Filters & Actions Bar */}
        {leads.length > 0 && (
          <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00c868] font-bold">
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              {/* Search Input */}
              <div className="lg:col-span-4 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all placeholder:text-zinc-600"
                />
              </div>

              {/* Segment Filter */}
              <div className="lg:col-span-3">
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Todos os Segmentos</option>
                  {uniqueSegments.map((seg, idx) => (
                    <option key={idx} value={seg} className="bg-zinc-950 text-white">{seg}</option>
                  ))}
                </select>
              </div>

              {/* Website Filter */}
              <div className="lg:col-span-2">
                <select
                  value={websiteFilter}
                  onChange={(e) => setWebsiteFilter(e.target.value as any)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Website: Todos</option>
                  <option value="sem_site" className="bg-zinc-950 text-white">Sem Website</option>
                  <option value="com_site" className="bg-zinc-950 text-white">Com Website</option>
                </select>
              </div>

              {/* Phone Filter */}
              <div className="lg:col-span-2">
                <select
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value as any)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Telefone: Todos</option>
                  <option value="com_telefone" className="bg-zinc-950 text-white">Com Telefone</option>
                  <option value="sem_telefone" className="bg-zinc-950 text-white">Sem Telefone</option>
                </select>
              </div>

              {/* Export Button */}
              <div className="lg:col-span-1">
                <button
                  onClick={handleExportCSV}
                  title="Exportar CSV dos leads filtrados"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00c868]/10 hover:bg-[#00c868] text-white hover:text-black border border-[#00c868]/20 hover:border-[#00c868] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table / Empty State */}
        {leads.length > 0 ? (
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00c868] animate-pulse" />
                Leads Filtrados ({filteredLeads.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-900/20 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-bold">Nome</th>
                    <th className="p-4 font-bold">Segmento</th>
                    <th className="p-4 font-bold">Telefone</th>
                    <th className="p-4 font-bold">Endereço</th>
                    <th className="p-4 font-bold">Website</th>
                    <th className="p-4 font-bold">Status do Site</th>
                    <th className="p-4 font-bold">Avaliação</th>
                    <th className="p-4 font-bold">Coleta</th>
                    <th className="p-4 font-bold">Observações</th>
                    <th className="p-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-zinc-900/10 transition-colors">
                        {/* Nome */}
                        <td className="p-4 font-bold text-white max-w-[180px] truncate" title={lead.nome}>
                          {lead.nome}
                        </td>
                        
                        {/* Segmento */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {lead.segmento}
                          </span>
                        </td>

                        {/* Telefone */}
                        <td className="p-4 font-mono text-zinc-300 whitespace-nowrap">
                          {lead.telefone}
                        </td>

                        {/* Endereço */}
                        <td className="p-4 text-zinc-400 max-w-[200px] truncate" title={lead.endereco}>
                          {lead.endereco}
                        </td>

                        {/* Website */}
                        <td className="p-4 max-w-[150px] truncate">
                          {lead.website ? (
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span>Link</span>
                            </a>
                          ) : (
                            <span className="text-zinc-600 italic">Nenhum</span>
                          )}
                        </td>

                        {/* Status do Site */}
                        <td className="p-4">
                          {lead.tem_website ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                              {lead.status_site}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider">
                              {lead.status_site}
                            </span>
                          )}
                        </td>

                        {/* Avaliação */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-mono text-[11px]">{lead.rating}</span>
                          </div>
                        </td>

                        {/* Data da Coleta */}
                        <td className="p-4 text-zinc-500 whitespace-nowrap font-mono text-[10px]">
                          {lead.coletado_em}
                        </td>

                        {/* Observações */}
                        <td className="p-4 min-w-[180px]">
                          <input
                            type="text"
                            placeholder="Adicionar observação..."
                            value={lead.observacao || ''}
                            onChange={(e) => handleUpdateObservation(lead.id, e.target.value)}
                            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00c868] transition-all"
                          />
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Phone */}
                            {lead.telefone && lead.telefone !== 'Não informado' && (
                              <button
                                onClick={() => copyText(lead.telefone, "Telefone copiado!")}
                                title="Copiar Telefone"
                                className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Copy Address */}
                            <button
                              onClick={() => copyText(lead.endereco, "Endereço copiado!")}
                              title="Copiar Endereço"
                              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>

                            {/* Open Google Maps */}
                            {lead.google_maps_url && (
                              <a
                                href={lead.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir no Google Maps"
                                className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#00c868] transition-colors inline-block"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-zinc-500 italic">
                        Nenhum lead corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-24 border border-dashed border-zinc-900 rounded-3xl space-y-6 bg-zinc-950/20">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-zinc-500" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">Nenhum dado importado</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Importe um arquivo JSON gerado pelo <strong>RadarLocal Python</strong> para visualizar, filtrar e gerenciar seus leads comerciais de forma profissional.
              </p>
            </div>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all cursor-pointer shadow-[0_10px_20px_rgba(0,200,104,0.15)]">
                <Upload className="w-4 h-4" />
                <span>Selecionar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}