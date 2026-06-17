"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Phone, Globe, Save, CheckCircle, 
  Trash2, PhoneCall, Database, AlertCircle, RefreshCw, 
  TrendingUp, Users, CheckSquare, FileText, ArrowLeft, 
  ExternalLink, Copy, Settings, Check, Info, PlusCircle, Filter, Sliders, HelpCircle, Lock, User, LogOut, Clipboard, Sparkles
} from 'lucide-react';
import { leadService, ProspectLead, isSupabaseConfigured } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import ScrollReveal from '@/components/ScrollReveal';

// Interface detalhada para sugestões de endereço do Nominatim
interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  
  // Estados de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Estados do Painel
  const [activeTab, setActiveTab] = useState<'prospector' | 'saved'>('prospector');
  
  // Estados de Busca e Autocomplete
  const [cepOrAddress, setCepOrAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  
  // Estado do Assistente de Captura Inteligente
  const [pastedText, setPastedText] = useState('');
  const [parsedLead, setParsedLead] = useState({
    name: '',
    phone: '',
    address: '',
    segment: '',
    cep: '',
    has_website: false,
    notes: ''
  });

  // Estados de Controle e Resultados
  const [savedLeads, setSavedLeads] = useState<ProspectLead[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  // Estado para Cadastro Manual de Lead
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLead, setManualLead] = useState({
    name: '',
    phone: '',
    segment: '',
    address: '',
    cep: '',
    has_website: false,
    notes: '',
    image_url: ''
  });

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Verificar autenticação e carregar configurações ao iniciar
  useEffect(() => {
    const authStatus = sessionStorage.getItem('acioli_admin_auth') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
      loadSavedLeads();
    }

    // Fechar sugestões ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAuthenticated]);

  // Função de Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'acioli' && password === 'aciolilouyse123***') {
      sessionStorage.setItem('acioli_admin_auth', 'true');
      setIsAuthenticated(true);
      showSuccess("Acesso autorizado com sucesso!");
    } else {
      setLoginError("Usuário ou senha incorretos.");
      showError("Credenciais inválidas.");
    }
  };

  // Função de Logout
  const handleLogout = () => {
    sessionStorage.removeItem('acioli_admin_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    showSuccess("Sessão encerrada.");
  };

  // Carregar leads salvos
  const loadSavedLeads = async () => {
    const leads = await leadService.getLeads();
    setSavedLeads(leads);
    
    const notesMap: { [key: string]: string } = {};
    leads.forEach(lead => {
      notesMap[lead.id] = lead.notes || '';
    });
    setEditingNotes(notesMap);
  };

  // Buscar sugestões de endereço com detalhes estruturados
  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCepOrAddress(value);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=br&limit=5&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Erro ao buscar sugestões de endereço:", err);
    }
  };

  // Selecionar sugestão de endereço
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setCepOrAddress(suggestion.display_name);
    setShowSuggestions(false);
  };

  // Abrir busca direta no Google Maps oficial
  const handleOpenGoogleMaps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepOrAddress.trim()) {
      showError("Por favor, informe uma Cidade, Bairro ou CEP.");
      return;
    }

    const query = customQuery.trim() || 'Empresas';
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${query} em ${cepOrAddress}`)}`;
    window.open(searchUrl, '_blank');
    showSuccess("Google Maps aberto em uma nova aba! Busque as empresas lá.");
  };

  // Algoritmo de Leitura e Extração Inteligente de Dados do Google Maps
  const handleParseText = (text: string) => {
    setPastedText(text);
    if (!text.trim()) return;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let name = '';
    let phone = '';
    let address = '';
    let hasWebsite = false;

    // 1. Extração do Nome (Geralmente a primeira linha que não seja classificação ou horário)
    if (lines.length > 0) {
      name = lines[0];
    }

    // 2. Extração do Telefone (Procura padrões de telefone celular ou fixo do Brasil)
    const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch && phoneMatch.length > 0) {
      phone = phoneMatch[0];
    }

    // 3. Extração do Endereço (Procura linhas que contenham palavras-chave de endereço ou CEP)
    const addressKeywords = ['rua', 'av.', 'avenida', 'r.', 'bairro', 'cep', 'estrada', 'praça', 'pç', 'rodovia'];
    const cepRegex = /\d{5}-\d{3}/;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const hasKeyword = addressKeywords.some(keyword => lowerLine.includes(keyword));
      const hasCep = cepRegex.test(line);

      if (hasKeyword || hasCep) {
        address = line;
        // Se achou o CEP, tenta extrair
        const cepMatch = line.match(cepRegex);
        if (cepMatch) {
          parsedLead.cep = cepMatch[0];
        }
        break;
      }
    }

    // 4. Detecção de Website
    const webKeywords = ['www.', '.com', '.br', '.net', '.org'];
    hasWebsite = webKeywords.some(keyword => text.toLowerCase().includes(keyword)) && !text.toLowerCase().includes('google.com');

    setParsedLead({
      name: name,
      phone: phone || 'Não informado',
      address: address || 'Endereço não identificado',
      segment: customQuery || 'Geral',
      cep: parsedLead.cep || 'Não informado',
      has_website: hasWebsite,
      notes: 'Lead capturado via Assistente Inteligente do Google Maps.'
    });
  };

  // Salvar lead capturado pelo assistente
  const handleSaveParsedLead = async () => {
    if (!parsedLead.name) {
      showError("Por favor, cole as informações de uma empresa para capturar.");
      return;
    }

    try {
      // Retorna uma imagem temática de alta resolução baseada no segmento do negócio
      const getBusinessImage = (segment: string): string => {
        const seg = segment.toLowerCase();
        if (seg.includes('restaurante') || seg.includes('pizzaria') || seg.includes('sushi') || seg.includes('bistrô') || seg.includes('churrascaria') || seg.includes('comida') || seg.includes('food') || seg.includes('restaurant')) {
          return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60';
        }
        if (seg.includes('oficina') || seg.includes('mecânica') || seg.includes('mecanica') || seg.includes('car') || seg.includes('auto') || seg.includes('repair')) {
          return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60';
        }
        if (seg.includes('estetica') || seg.includes('estética') || seg.includes('beleza') || seg.includes('salão') || seg.includes('salao') || seg.includes('barbearia') || seg.includes('barber') || seg.includes('spa') || seg.includes('beauty')) {
          return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=60';
        }
        if (seg.includes('clinica') || seg.includes('clínica') || seg.includes('odonto') || seg.includes('médico') || seg.includes('medico') || seg.includes('dentista') || seg.includes('saúde') || seg.includes('saude') || seg.includes('clinic')) {
          return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60';
        }
        if (seg.includes('academia') || seg.includes('fitness') || seg.includes('crossfit') || seg.includes('gym')) {
          return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60';
        }
        if (seg.includes('loja') || seg.includes('boutique') || seg.includes('comércio') || seg.includes('comercio') || seg.includes('mercado') || seg.includes('pet') || seg.includes('shop')) {
          return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=60';
        }
        return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60';
      };

      await leadService.saveLead({
        name: parsedLead.name,
        phone: parsedLead.phone,
        segment: parsedLead.segment,
        address: parsedLead.address,
        cep: parsedLead.cep,
        has_website: parsedLead.has_website,
        status: 'Pendente',
        notes: parsedLead.notes,
        image_url: getBusinessImage(parsedLead.segment)
      });

      showSuccess(`Empresa "${parsedLead.name}" salva com sucesso!`);
      
      // Limpa os campos para a próxima captura
      setPastedText('');
      setParsedLead({
        name: '',
        phone: '',
        address: '',
        segment: '',
        cep: '',
        has_website: false,
        notes: ''
      });
      loadSavedLeads();
    } catch (err) {
      showError("Erro ao salvar lead capturado.");
    }
  };

  // Salvar lead manual
  const handleSaveManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLead.name || !manualLead.phone || !manualLead.address) {
      showError("Por favor, preencha os campos obrigatórios.");
      return;
    }

    try {
      await leadService.saveLead({
        name: manualLead.name,
        phone: manualLead.phone,
        segment: manualLead.segment || 'Geral',
        address: manualLead.address,
        cep: manualLead.cep || 'Não informado',
        has_website: manualLead.has_website,
        status: 'Pendente',
        notes: manualLead.notes,
        image_url: manualLead.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=60'
      });

      showSuccess(`Lead "${manualLead.name}" cadastrado com sucesso!`);
      setShowManualForm(false);
      setManualLead({
        name: '',
        phone: '',
        segment: '',
        address: '',
        cep: '',
        has_website: false,
        notes: '',
        image_url: ''
      });
      loadSavedLeads();
    } catch (err) {
      showError("Erro ao cadastrar lead manual.");
    }
  };

  // Atualizar status do lead salvo
  const handleUpdateStatus = async (id: string, status: ProspectLead['status']) => {
    const notes = editingNotes[id] || '';
    await leadService.updateLeadStatus(id, status, notes);
    showSuccess("Status atualizado!");
    loadSavedLeads();
  };

  // Salvar anotação do lead salvo
  const handleSaveNotes = async (id: string, status: ProspectLead['status']) => {
    const notes = editingNotes[id] || '';
    await leadService.updateLeadStatus(id, status, notes);
    showSuccess("Anotações salvas!");
    loadSavedLeads();
  };

  // Deletar lead salvo
  const handleDeleteLead = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lead?")) {
      await leadService.deleteLead(id);
      showSuccess("Lead removido.");
      loadSavedLeads();
    }
  };

  // Copiar texto para a área de transferência
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  // Estatísticas rápidas
  const stats = {
    total: savedLeads.length,
    pending: savedLeads.filter(l => l.status === 'Pendente').length,
    contacted: savedLeads.filter(l => l.status === 'Contatado').length,
    scheduled: savedLeads.filter(l => l.status === 'Agendado').length,
  };

  // Se não estiver autenticado, renderiza a tela de login premium
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased flex items-center justify-center p-6 relative overflow-hidden">
        {/* Luz ambiente de fundo verde */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00c868]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative group z-10">
          {/* Efeito Glow Traseiro */}
          <div className="absolute -inset-px bg-gradient-to-r from-[#00c868]/30 via-zinc-800 to-[#00c868]/10 rounded-3xl opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700" />
          
          <div className="relative bg-zinc-950/90 rounded-3xl p-8 sm:p-10 border border-zinc-850/80 shadow-2xl space-y-8">
            
            {/* Header do Login */}
            <div className="text-center space-y-2">
              <div 
                onClick={() => navigate('/')} 
                className="cursor-pointer font-bold tracking-tight text-white text-2xl hover:opacity-90 transition-opacity inline-block"
              >
                acioli<span className="text-[#00c868] font-light">.lab</span>
              </div>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono font-bold">Painel de Controle</p>
            </div>

            {/* Formulário de Login */}
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
                <span>Acessar Painel</span>
              </button>
            </form>

            {/* Botão de Voltar */}
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
      
      {/* Luz ambiente de fundo verde */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00c868]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header do Painel */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-zinc-900 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-full border border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">PROSPECÇÃO ATIVA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Painel de Prospecção Nacional
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Busque empresas reais diretamente no Google Maps oficial e capture os dados instantaneamente com o nosso assistente inteligente.
            </p>
          </div>

          {/* Botões de Configuração e Status */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00c868]/10 border border-[#00c868]/30 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Lead Manual</span>
            </button>

            {/* Botão de Logout com Ícone e Texto Claro */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair / Logout</span>
            </button>
          </div>
        </div>

        {/* Formulário de Cadastro Manual de Lead */}
        {showManualForm && (
          <ScrollReveal className="bg-zinc-950/90 border border-zinc-850 p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#00c868]" />
                Cadastrar Novo Lead Manualmente
              </h3>
              <button 
                onClick={() => setShowManualForm(false)}
                className="text-zinc-500 hover:text-white text-xs uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSaveManualLead} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barbearia do Zé"
                  value={manualLead.name}
                  onChange={(e) => setManualLead(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Telefone Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (81) 99999-9999"
                  value={manualLead.phone}
                  onChange={(e) => setManualLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Segmento / Nicho</label>
                <input
                  type="text"
                  placeholder="Ex: Barbearia, Restaurante, Clínica"
                  value={manualLead.segment}
                  onChange={(e) => setManualLead(prev => ({ ...prev, segment: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">CEP</label>
                <input
                  type="text"
                  placeholder="Ex: 50000-000"
                  value={manualLead.cep}
                  onChange={(e) => setManualLead(prev => ({ ...prev, cep: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Endereço Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rua das Flores, 123 - Bairro, Cidade - UF"
                  value={manualLead.address}
                  onChange={(e) => setManualLead(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">URL da Imagem (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: https://images.unsplash.com/..."
                  value={manualLead.image_url}
                  onChange={(e) => setManualLead(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">Anotações Iniciais</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Encontrei no Instagram, parece não ter site ativo..."
                  value={manualLead.notes}
                  onChange={(e) => setManualLead(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868] resize-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="manual_has_website"
                  checked={manualLead.has_website}
                  onChange={(e) => setManualLead(prev => ({ ...prev, has_website: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#00c868] focus:ring-[#00c868]"
                />
                <label htmlFor="manual_has_website" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Esta empresa já possui um website oficial?
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-850 text-zinc-400 hover:text-white text-xs uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00c868] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all cursor-pointer"
                >
                  Salvar Lead na Lista
                </button>
              </div>
            </form>
          </ScrollReveal>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total de Leads Salvos', value: stats.total, icon: Users, color: 'text-white' },
            { label: 'Aguardando Ligação', value: stats.pending, icon: PhoneCall, color: 'text-amber-400' },
            { label: 'Contatados', value: stats.contacted, icon: CheckSquare, color: 'text-blue-400' },
            { label: 'Reuniões Agendadas', value: stats.scheduled, icon: TrendingUp, color: 'text-[#00c868]' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 opacity-20 ${stat.color}`} />
            </div>
          ))}
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-zinc-900">
          <button
            onClick={() => setActiveTab('prospector')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'prospector'
                ? 'border-[#00c868] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Assistente Google Maps (Sem API)
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-[#00c868] text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>Leads Salvos</span>
            <span className="bg-zinc-900 text-zinc-400 text-xs px-2 py-0.5 rounded-full font-mono">
              {savedLeads.length}
            </span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'prospector' ? (
          <div className="space-y-8">
            
            {/* PASSO 1: Abrir Google Maps */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-8 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                <div className="p-2 bg-[#00c868]/10 rounded-xl text-[#00c868]">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Passo 1: Buscar no Google Maps Oficial</h3>
                  <p className="text-xs text-zinc-400">Abra o Google Maps com a busca pronta para encontrar empresas reais e ativas.</p>
                </div>
              </div>

              <form onSubmit={handleOpenGoogleMaps} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-5 space-y-2 relative" ref={autocompleteRef}>
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    Cidade, Bairro ou CEP
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Encruzilhada, Recife"
                      value={cepOrAddress}
                      onChange={handleAddressChange}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Dropdown de Sugestões */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-zinc-950 border border-zinc-850 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-zinc-900">
                      {suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="p-3 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer transition-colors flex items-start gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#00c868] shrink-0 mt-0.5" />
                          <span>{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    O que deseja buscar?
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ex: Restaurantes, Clínicas, Lojas"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Google Maps</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PASSO 2: Captura Inteligente */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Coluna Esquerda: Área de Colar */}
              <div className="lg:col-span-6 bg-zinc-950/40 border border-zinc-900 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <div className="p-2 bg-[#00c868]/10 rounded-xl text-[#00c868]">
                    <Clipboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Passo 2: Colar Informações do Google</h3>
                    <p className="text-xs text-zinc-400">Copie as informações da empresa no Google Maps e cole no campo abaixo.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    Cole o texto copiado do Google Maps aqui
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => handleParseText(e.target.value)}
                    placeholder="Exemplo de texto para colar:&#10;Barbearia do Zé&#10;Rua das Flores, 123 - Encruzilhada, Recife - PE&#10;(81) 99999-9999"
                    className="w-full bg-zinc-900/20 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/40 transition-all resize-none placeholder:text-zinc-600 leading-relaxed"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900 flex items-start gap-3 text-xs text-zinc-500">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#00c868]" />
                  <p>
                    Nosso leitor inteligente vai identificar automaticamente o <strong>Nome</strong>, <strong>Telefone</strong> e <strong>Endereço real</strong> da empresa para você salvar na sua lista de prospecção com um clique.
                  </p>
                </div>
              </div>

              {/* Coluna Direita: Visualização e Confirmação do Lead */}
              <div className="lg:col-span-6 bg-zinc-950/40 border border-zinc-900 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <div className="p-2 bg-[#00c868]/10 rounded-xl text-[#00c868]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Passo 3: Confirmar e Salvar Lead</h3>
                    <p className="text-xs text-zinc-400">Verifique se os dados foram extraídos corretamente e salve na sua lista.</p>
                  </div>
                </div>

                {parsedLead.name ? (
                  <div className="space-y-5">
                    {/* Nome */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Nome da Empresa</span>
                      <input
                        type="text"
                        value={parsedLead.name}
                        onChange={(e) => setParsedLead(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868]"
                      />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Telefone Comercial</span>
                      <input
                        type="text"
                        value={parsedLead.phone}
                        onChange={(e) => setParsedLead(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868]"
                      />
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Endereço Completo</span>
                      <textarea
                        rows={2}
                        value={parsedLead.address}
                        onChange={(e) => setParsedLead(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00c868] resize-none"
                      />
                    </div>

                    {/* Website Status */}
                    <div className="flex items-center gap-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-900">
                      <input
                        type="checkbox"
                        id="parsed_has_website"
                        checked={parsedLead.has_website}
                        onChange={(e) => setParsedLead(prev => ({ ...prev, has_website: e.target.checked }))}
                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#00c868] focus:ring-[#00c868]"
                      />
                      <label htmlFor="parsed_has_website" className="text-xs text-zinc-300 cursor-pointer select-none">
                        Esta empresa já possui um website oficial?
                      </label>
                    </div>

                    {/* Botão de Salvar */}
                    <button
                      onClick={handleSaveParsedLead}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Lead na Lista de Prospecção</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-zinc-900 rounded-2xl space-y-3">
                    <Sparkles className="w-10 h-10 text-zinc-800 mx-auto" />
                    <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                      Aguardando você colar as informações do Google Maps na área ao lado para iniciar a extração automática.
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>
        ) : (
          /* Aba de Leads Salvos */
          <div className="space-y-6">
            {savedLeads.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-bold text-white leading-tight">{lead.name}</h4>
                          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {lead.segment}
                          </span>
                        </div>

                        {/* Seletor de Status */}
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as ProspectLead['status'])}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${
                            lead.status === 'Pendente' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                            lead.status === 'Contatado' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                            lead.status === 'Agendado' ? 'bg-[#00c868]/10 border-[#00c868]/30 text-[#00c868]' :
                            'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <option value="Pendente" className="bg-zinc-950 text-amber-400">Pendente</option>
                          <option value="Contatado" className="bg-zinc-950 text-blue-400">Contatado</option>
                          <option value="Agendado" className="bg-zinc-950 text-[#00c868]">Agendado</option>
                          <option value="Sem Interesse" className="bg-zinc-950 text-zinc-400">Sem Interesse</option>
                        </select>
                      </div>

                      {/* Endereço Completo */}
                      <div className="space-y-1.5 bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#00c868]" />
                          Endereço Completo
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed font-light">
                          {lead.address}
                        </p>
                        <button
                          onClick={() => copyToClipboard(lead.address, "Endereço copiado!")}
                          className="text-[10px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1 mt-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar Endereço</span>
                        </button>
                      </div>

                      {/* Telefone Comercial */}
                      <div className="flex items-center justify-between bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                        <div className="space-y-0.5">
                          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Telefone Comercial</p>
                          <p className="text-sm font-mono text-white font-bold">{lead.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(lead.phone, "Telefone copiado!")}
                            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                            title="Copiar Telefone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`tel:${lead.phone.replace(/\D/g, '')}`}
                            className="p-2 rounded-lg bg-[#00c868]/10 border border-[#00c868]/20 text-[#00c868] hover:bg-[#00c868] hover:text-black transition-all"
                            title="Ligar para Empresa"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Anotações / Histórico */}
                      <div className="space-y-2">
                        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Anotações / Histórico de Contato</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Ex: Liguei dia 10, falar com o gerente Marcos na terça..."
                            value={editingNotes[lead.id] || ''}
                            onChange={(e) => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                            className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00c868]"
                          />
                          <button
                            onClick={() => handleSaveNotes(lead.id, lead.status)}
                            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                            title="Salvar anotação"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ações do Card */}
                    <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3 mt-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>Ver no Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#00c868] transition-all"
                          title="WhatsApp"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                          title="Excluir Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-900 rounded-3xl space-y-4">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-zinc-400 font-medium">Nenhum lead salvo ainda</p>
                  <p className="text-zinc-600 text-xs max-w-md mx-auto">
                    Faça uma busca na aba ao lado e salve as empresas de interesse para gerenciar suas ligações e prospecções.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}