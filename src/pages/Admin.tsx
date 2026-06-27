"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Search, Filter, Trash2, Copy, ExternalLink, 
  Lock, User, LogOut, ArrowLeft, Globe, Phone, MapPin, Star, 
  AlertCircle, MessageSquare, Calendar, Pencil, Check, X, Save,
  RefreshCw, CheckCircle2, Shield
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { leadService, RadarLead, isSupabaseConfigured } from '@/lib/supabase';

export default function Admin() {
  const navigate = useNavigate();
  
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data States
  const [leads, setLeads] = useState<RadarLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary Preview States (for manual saving)
  const [tempLeads, setTempLeads] = useState<RadarLead[] | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('todos');
  const [selectedGroup, setSelectedGroup] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [websiteFilter, setWebsiteFilter] = useState<'todos' | 'sem_site' | 'com_site'>('todos');
  const [phoneFilter, setPhoneFilter] = useState<'todos' | 'com_telefone' | 'sem_telefone'>('todos');

  // Rename States
  const [isRenaming, setIsRenaming] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('acioli_admin_auth') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
      loadLeads();
    }
  }, [isAuthenticated]);

  // Automatically select the most recent list when leads are loaded
  useEffect(() => {
    if (leads.length > 0 && selectedGroup === 'todos') {
      const uniqueGroups = Array.from(new Set(leads.map(l => l.grupo_importacao))).filter(Boolean);
      if (uniqueGroups.length > 0) {
        setSelectedGroup(uniqueGroups[0]);
      }
    }
  }, [leads]);

  // Load leads from Supabase or LocalStorage
  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await leadService.getLeads();
      setLeads(data);
    } catch (err) {
      showError("Erro ao carregar os leads.");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Format current date and hour for group name
  const getFormattedGroupName = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `Leads - ${day}/${month}/${year} ${hours}:${minutes}`;
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

        const defaultGroupName = getFormattedGroupName();

        const validated: RadarLead[] = json.map((item: any, index: number) => {
          const websiteUrl = (item.website || item.site || "").trim();
          const hasWebsiteField = item.tem_website !== undefined ? item.tem_website : (item.tem_site !== undefined ? item.tem_site : null);
          
          let tem_website = false;
          if (hasWebsiteField !== null) {
            if (typeof hasWebsiteField === 'boolean') {
              tem_website = hasWebsiteField;
            } else if (typeof hasWebsiteField === 'string') {
              const lower = hasWebsiteField.toLowerCase().trim();
              tem_website = lower === 'true' || lower === 'sim' || lower === 'yes' || lower === '1';
            }
          } else {
            tem_website = !!(websiteUrl && websiteUrl !== 'Não informado' && websiteUrl !== 'None' && websiteUrl !== 'null');
          }

          return {
            id: item.id || `lead_${Date.now()}_${index}`,
            nome: item.nome || item.name || "Sem nome",
            segmento: item.segmento || item.segment || "Não informado",
            segmento_pesquisado: item.segmento_pesquisado || "Geral",
            telefone: item.telefone || item.phone || "Não informado",
            endereco: item.endereco || item.address || "Não informado",
            website: websiteUrl === 'None' || websiteUrl === 'Não informado' || websiteUrl === 'null' ? "" : websiteUrl,
            tem_website: tem_website,
            status_site: item.status_site || (tem_website ? "Com site" : "Sem site"),
            rating: item.rating || "Não avaliado",
            origem: item.origem || "Google Maps",
            google_maps_url: item.google_maps_url || "",
            coletado_em: item.coletado_em || new Date().toISOString().split('T')[0],
            observacao: item.observacao || "",
            grupo_importacao: defaultGroupName,
            status_prospeccao: 'Pendente'
          };
        });

        setTempLeads(validated);
        setTempGroupName(defaultGroupName);
        showSuccess(`${validated.length} leads carregados! Defina o nome e clique em "Salvar Lista" abaixo.`);
      } catch (err) {
        showError("Erro ao ler o arquivo JSON. Verifique a formatação.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save the previewed leads manually
  const handleSaveManual = async () => {
    if (!tempLeads || tempLeads.length === 0) {
      showError("Nenhum lead para salvar.");
      return;
    }

    if (!tempGroupName.trim()) {
      showError("Por favor, insira um nome para a lista.");
      return;
    }

    setIsLoading(true);
    try {
      const leadsToSave = tempLeads.map(lead => ({
        ...lead,
        grupo_importacao: tempGroupName.trim()
      }));

      const updatedLeads = await leadService.saveLeads(leadsToSave);
      setLeads(updatedLeads);
      setSelectedGroup(tempGroupName.trim());
      setTempLeads(null);
      setTempGroupName('');
      showSuccess(`Lista "${tempGroupName.trim()}" salva com sucesso no banco de dados!`);
    } catch (err) {
      showError("Erro ao salvar a lista no banco de dados.");
    } finally {
      setIsLoading(false);
    }
  };

  // Discard the current preview
  const handleDiscardPreview = () => {
    setTempLeads(null);
    setTempGroupName('');
    showSuccess("Importação descartada.");
  };

  // Clear all imported data
  const handleClearData = async () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      setIsLoading(true);
      try {
        await leadService.clearAll();
        setLeads([]);
        setSelectedGroup('todos');
        showSuccess("Todos os dados foram limpos.");
      } catch (err) {
        showError("Erro ao limpar os dados.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Delete a specific group/list
  const handleDeleteGroup = async (groupName: string) => {
    if (window.confirm(`Tem certeza que deseja deletar a lista "${groupName}" e todos os seus leads?`)) {
      setIsLoading(true);
      try {
        const success = await leadService.deleteGroup(groupName);
        if (success) {
          setLeads(prev => prev.filter(lead => lead.grupo_importacao !== groupName));
          setSelectedGroup('todos');
          showSuccess(`Lista "${groupName}" deletada com sucesso.`);
        } else {
          showError("Não foi possível deletar a lista.");
        }
      } catch (err) {
        showError("Erro ao deletar a lista.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update observation or status for a specific lead
  const handleUpdateLead = async (id: string, updates: Partial<RadarLead>) => {
    try {
      const success = await leadService.updateLead(id, updates);
      if (success) {
        setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead));
      }
    } catch (err) {
      showError("Erro ao atualizar o lead.");
    }
  };

  // Handle Rename Group
  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) {
      showError("O nome da lista não pode ser vazio.");
      return;
    }

    if (newGroupName === selectedGroup) {
      setIsRenaming(false);
      return;
    }

    setIsLoading(true);
    try {
      const success = await leadService.renameGroup(selectedGroup, newGroupName.trim());
      if (success) {
        setLeads(prev => prev.map(lead => 
          lead.grupo_importacao === selectedGroup 
            ? { ...lead, grupo_importacao: newGroupName.trim() } 
            : lead
        ));
        setSelectedGroup(newGroupName.trim());
        setIsRenaming(false);
        showSuccess("Lista renomeada com sucesso!");
      } else {
        showError("Não foi possível renomear a lista.");
      }
    } catch (err) {
      showError("Erro ao renomear a lista.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy text helper
  const copyText = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  // Clean phone number for links
  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  // Get unique segments, groups
  const uniqueSegments = Array.from(new Set(leads.map(l => l.segmento))).filter(Boolean);
  const uniqueGroups = Array.from(new Set(leads.map(l => l.grupo_importacao))).filter(Boolean);

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.endereco.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSegment = selectedSegment === 'todos' || lead.segmento === selectedSegment;
    const matchesGroup = selectedGroup === 'todos' || lead.grupo_importacao === selectedGroup;
    const matchesStatus = selectedStatus === 'todos' || lead.status_prospeccao === selectedStatus;
    
    const matchesWebsite = websiteFilter === 'todos' || 
      (websiteFilter === 'sem_site' && !lead.tem_website) || 
      (websiteFilter === 'com_site' && lead.tem_website);

    const hasPhone = lead.telefone && lead.telefone !== 'Não informado' && lead.telefone.trim() !== '';
    const matchesPhone = phoneFilter === 'todos' || 
      (phoneFilter === 'com_telefone' && hasPhone) || 
      (phoneFilter === 'sem_telefone' && !hasPhone);

    return matchesSearch && matchesSegment && matchesGroup && matchesStatus && matchesWebsite && matchesPhone;
  });

  // Dashboard Stats
  const totalLeads = leads.length;
  const totalSemSite = leads.filter(l => !l.tem_website).length;
  const totalComSite = leads.filter(l => l.tem_website).length;
  const totalComTelefone = leads.filter(l => l.telefone && l.telefone !== 'Não informado' && l.telefone.trim() !== '').length;
  
  // Get unique searched segments
  const uniqueSearchedSegments = Array.from(new Set(leads.map(l => l.segmento_pesquisado))).filter(Boolean);

  // Status styling helper
  const getStatusBadgeClass = (status: RadarLead['status_prospeccao']) => {
    switch (status) {
      case 'Pendente': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'Contatado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Aguardando Resposta': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Fechado': return 'bg-[#00c868]/10 text-[#00c868] border-[#00c868]/20';
      case 'Sem Interesse': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

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
                <span>Acessar</span>
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
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Painel de Prospecção Comercial
              {isSupabaseConfigured ? (
                <span className="text-[10px] font-mono bg-[#00c868]/10 text-[#00c868] border border-[#00c868]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Nuvem Ativa (Supabase)
                </span>
              ) : (
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Local (LocalStorage)
                </span>
              )}
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Importe, visualize e filtre leads comerciais gerados pelo script Python do RadarLocal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dorks')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#00c868]/20 bg-[#00c868]/5 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Dorks</span>
            </button>
            <button
              onClick={loadLeads}
              className="p-2.5 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white transition-all"
              title="Sincronizar / Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair / Logout</span>
            </button>
          </div>
        </div>

        {/* ÁREA DE PRÉ-VISUALIZAÇÃO MANUAL */}
        {tempLeads && (
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-[#00c868] to-emerald-500 rounded-3xl opacity-40 blur-md animate-pulse" />
            <div className="relative bg-zinc-950 border-2 border-[#00c868] p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#00c868]/10 border border-[#00c868]/30 rounded-2xl text-[#00c868]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Lista Carregada com Sucesso!
                      <span className="text-xs font-mono bg-[#00c868]/10 text-[#00c868] border border-[#00c868]/20 px-2.5 py-0.5 rounded-full">
                        {tempLeads.length} Leads Pendentes
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Revise ou altere o nome da lista abaixo e clique em <strong>Salvar Lista Manualmente</strong> para gravar no banco de dados.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDiscardPreview}
                    className="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={handleSaveManual}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c868] text-black hover:bg-[#00b05b] font-black text-xs uppercase tracking-wider transition-all shadow-[0_10px_20px_rgba(0,200,104,0.2)] disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? 'Salvando...' : 'Salvar Lista Manualmente'}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-900 pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-1/3 space-y-1.5">
                  <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Nome da Lista / Lote</label>
                  <input
                    type="text"
                    value={tempGroupName}
                    onChange={(e) => setTempGroupName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all"
                    placeholder="Ex: Leads - Recife Centro"
                  />
                </div>
                <div className="flex-1 text-xs text-zinc-500 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-[#00c868] inline mr-1.5 -mt-0.5" />
                  Ao salvar, todos os {tempLeads.length} leads serão vinculados ao lote <strong>"{tempGroupName}"</strong> e estarão disponíveis para filtragem e prospecção.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SELETOR DE LISTAS POR DATA */}
        {uniqueGroups.length > 0 && (
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/20 to-zinc-800 rounded-2xl opacity-30 blur-sm" />
            <div className="relative bg-zinc-950/80 border border-zinc-850 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#00c868]/10 border border-[#00c868]/20 rounded-xl text-[#00c868]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Selecione a Lista de Leads</h3>
                  <p className="text-xs text-zinc-500">Alterne entre as listas salvas por data e hora de importação</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isRenaming ? (
                  <div className="flex items-center gap-2 w-full sm:w-80">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-[#00c868] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      placeholder="Novo nome da lista..."
                      autoFocus
                    />
                    <button
                      onClick={handleRenameGroup}
                      className="p-2.5 rounded-xl bg-[#00c868] text-black hover:bg-[#00b05b] transition-all"
                      title="Salvar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsRenaming(false)}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="flex-1 sm:flex-none sm:w-72 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-[#00c868] focus:ring-1 focus:ring-[#00c868]/20 transition-all cursor-pointer"
                    >
                      <option value="todos" className="bg-zinc-950 text-white">Mostrar Todas as Listas</option>
                      {uniqueGroups.map((group, idx) => (
                        <option key={idx} value={group} className="bg-zinc-950 text-white">{group}</option>
                      ))}
                    </select>

                    {selectedGroup !== 'todos' && (
                      <>
                        <button
                          onClick={() => {
                            setNewGroupName(selectedGroup);
                            setIsRenaming(true);
                          }}
                          className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-[#00c868]/40 transition-all"
                          title="Renomear esta lista"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(selectedGroup)}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          title="Deletar esta lista inteira"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import Section & Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Import Box */}
          <div className="lg:col-span-4 bg-zinc-950/60 border border-zinc-900 p-6 rounded-3xl flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00c868]" />
                Carregar Arquivo JSON
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
                <span>Limpar Todos os Dados</span>
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

              <div className="lg:col-span-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Status: Todos</option>
                  <option value="Pendente" className="bg-zinc-950 text-white">Pendente</option>
                  <option value="Contatado" className="bg-zinc-950 text-white">Contatado</option>
                  <option value="Aguardando Resposta" className="bg-zinc-950 text-white">Aguardando Resposta</option>
                  <option value="Fechado" className="bg-zinc-950 text-white">Fechado</option>
                  <option value="Sem Interesse" className="bg-zinc-950 text-white">Sem Interesse</option>
                </select>
              </div>

              <div className="lg:col-span-1.5">
                <select
                  value={websiteFilter}
                  onChange={(e) => setWebsiteFilter(e.target.value as any)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Site: Todos</option>
                  <option value="sem_site" className="bg-zinc-950 text-white">Sem Site</option>
                  <option value="com_site" className="bg-zinc-950 text-white">Com Site</option>
                </select>
              </div>

              <div className="lg:col-span-1.5">
                <select
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value as any)}
                  className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] transition-all cursor-pointer"
                >
                  <option value="todos" className="bg-zinc-950 text-white">Tel: Todos</option>
                  <option value="com_telefone" className="bg-zinc-950 text-white">Com Tel</option>
                  <option value="sem_telefone" className="bg-zinc-950 text-white">Sem Tel</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table / Empty State */}
        {leads.length > 0 ? (
          <div className="space-y-6">
            
            {/* MOBILE VIEW */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00c868] animate-pulse" />
                  {selectedGroup === 'todos' ? 'Todos os Leads' : `Leads da Lista: ${selectedGroup}`} ({filteredLeads.length})
                </h3>
              </div>

              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className={`p-5 rounded-2xl border bg-zinc-950/90 space-y-4 transition-all ${
                      lead.status_prospeccao === 'Pendente' 
                        ? 'border-zinc-800/80 shadow-[0_4px_20px_rgba(255,255,255,0.01)]' 
                        : 'border-zinc-900 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white leading-tight">{lead.nome}</h4>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {lead.segmento}
                          </span>
                          <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{lead.rating}</span>
                          </div>
                        </div>
                      </div>

                      <select
                        value={lead.status_prospeccao || 'Pendente'}
                        onChange={(e) => handleUpdateLead(lead.id, { status_prospeccao: e.target.value as any })}
                        className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer transition-all ${getStatusBadgeClass(lead.status_prospeccao || 'Pendente')}`}
                      >
                        <option value="Pendente" className="bg-zinc-950 text-zinc-400">Pendente</option>
                        <option value="Contatado" className="bg-zinc-950 text-blue-400">Contatado</option>
                        <option value="Aguardando Resposta" className="bg-zinc-950 text-amber-400">Aguardando Resposta</option>
                        <option value="Fechado" className="bg-zinc-950 text-[#00c868]">Fechado</option>
                        <option value="Sem Interesse" className="bg-zinc-950 text-red-400">Sem Interesse</option>
                      </select>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-900 pt-3">
                      {lead.telefone && lead.telefone !== 'Não informado' && (
                        <div className="flex items-center justify-between bg-zinc-900/30 p-2 rounded-xl border border-zinc-900">
                          <span className="font-mono text-zinc-300">{lead.telefone}</span>
                          <button 
                            onClick={() => copyText(lead.telefone, "Telefone copiado!")}
                            className="text-[10px] text-[#00c868] font-bold uppercase tracking-wider px-2 py-1 hover:bg-[#00c868]/10 rounded-lg transition-all"
                          >
                            Copiar
                          </button>
                        </div>
                      )}

                      {lead.endereco && lead.endereco !== 'Não informado' && (
                        <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                          <span className="truncate flex-1" title={lead.endereco}>{lead.endereco}</span>
                        </div>
                      )}

                      {lead.website && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:underline truncate flex-1"
                          >
                            {lead.website}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase tracking-wider font-bold font-mono text-zinc-500">Observações</label>
                      <input
                        type="text"
                        placeholder="Adicionar anotação..."
                        value={lead.observacao || ''}
                        onChange={(e) => handleUpdateLead(lead.id, { observacao: e.target.value })}
                        className="w-full bg-zinc-900/40 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00c868] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {lead.telefone && lead.telefone !== 'Não informado' ? (
                        <>
                          <a
                            href={`https://api.whatsapp.com/send?phone=55${cleanPhoneNumber(lead.telefone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00c868]/10 border border-[#00c868]/20 text-[#00c868] font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${cleanPhoneNumber(lead.telefone)}`}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Ligar</span>
                          </a>
                        </>
                      ) : (
                        <div className="col-span-2 text-center py-2 text-[10px] text-zinc-600 italic">
                          Nenhum telefone disponível para contato rápido.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 italic text-xs">
                  Nenhum lead corresponde aos filtros selecionados.
                </div>
              )}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block bg-zinc-950/40 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00c868] animate-pulse" />
                  {selectedGroup === 'todos' ? 'Todos os Leads' : `Leads da Lista: ${selectedGroup}`} ({filteredLeads.length})
                </h3>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-950 z-10">
                    <tr className="border-b border-zinc-900 bg-zinc-900/40 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      <th className="p-4 font-bold">Nome</th>
                      <th className="p-4 font-bold">Status Prospecção</th>
                      <th className="p-4 font-bold">Segmento</th>
                      <th className="p-4 font-bold">Telefone</th>
                      <th className="p-4 font-bold">Endereço</th>
                      <th className="p-4 font-bold">Website</th>
                      <th className="p-4 font-bold">Status do Site</th>
                      <th className="p-4 font-bold">Avaliação</th>
                      <th className="p-4 font-bold">Lote / Coleta</th>
                      <th className="p-4 font-bold">Observações</th>
                      <th className="p-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs">
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <tr 
                          key={lead.id} 
                          className={`transition-colors ${
                            lead.status_prospeccao === 'Pendente' 
                              ? 'bg-zinc-950/20 hover:bg-zinc-900/20' 
                              : 'hover:bg-zinc-900/10 opacity-75'
                          }`}
                        >
                          <td className="p-4 font-bold text-white whitespace-normal" title={lead.nome}>
                            {lead.nome}
                          </td>

                          <td className="p-4">
                            <select
                              value={lead.status_prospeccao || 'Pendente'}
                              onChange={(e) => handleUpdateLead(lead.id, { status_prospeccao: e.target.value as any })}
                              className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer transition-all ${getStatusBadgeClass(lead.status_prospeccao || 'Pendente')}`}
                            >
                              <option value="Pendente" className="bg-zinc-950 text-zinc-400">Pendente</option>
                              <option value="Contatado" className="bg-zinc-950 text-blue-400">Contatado</option>
                              <option value="Aguardando Resposta" className="bg-zinc-950 text-amber-400">Aguardando Resposta</option>
                              <option value="Fechado" className="bg-zinc-950 text-[#00c868]">Fechado</option>
                              <option value="Sem Interesse" className="bg-zinc-950 text-red-400">Sem Interesse</option>
                            </select>
                          </td>
                          
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              {lead.segmento}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-zinc-300 whitespace-nowrap">
                            {lead.telefone}
                          </td>

                          <td className="p-4 text-zinc-400 max-w-[200px] truncate" title={lead.endereco}>
                            {lead.endereco}
                          </td>

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

                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="font-mono text-[11px]">{lead.rating}</span>
                            </div>
                          </td>

                          <td className="p-4 text-zinc-500 whitespace-nowrap font-mono text-[10px]">
                            <div className="font-bold text-zinc-400">{lead.grupo_importacao}</div>
                            <div className="text-[9px] text-zinc-600">{lead.coletado_em}</div>
                          </td>

                          <td className="p-4 min-w-[180px]">
                            <input
                              type="text"
                              placeholder="Adicionar observação..."
                              value={lead.observacao || ''}
                              onChange={(e) => handleUpdateLead(lead.id, { observacao: e.target.value })}
                              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00c868] transition-all"
                            />
                          </td>

                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {lead.telefone && lead.telefone !== 'Não informado' && (
                                <a
                                  href={`https://api.whatsapp.com/send?phone=55${cleanPhoneNumber(lead.telefone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Chamar no WhatsApp"
                                  className="p-1.5 rounded bg-[#00c868]/10 border border-[#00c868]/20 text-[#00c868] hover:bg-[#00c868] hover:text-black transition-all inline-block"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {lead.telefone && lead.telefone !== 'Não informado' && (
                                <a
                                  href={`tel:${cleanPhoneNumber(lead.telefone)}`}
                                  title="Ligar diretamente"
                                  className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all inline-block"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {lead.telefone && lead.telefone !== 'Não informado' && (
                                <button
                                  onClick={() => copyText(lead.telefone, "Telefone copiado!")}
                                  title="Copiar Telefone"
                                  className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => copyText(lead.endereco, "Endereço copiado!")}
                                title="Copiar Endereço"
                                className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>

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
                        <td colSpan={11} className="p-8 text-center text-zinc-500 italic">
                          Nenhum lead corresponde aos filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
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