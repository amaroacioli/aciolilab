"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Phone, Globe, Save, CheckCircle, 
  Trash2, PhoneCall, Database, AlertCircle, RefreshCw, 
  TrendingUp, Users, CheckSquare, FileText, ArrowLeft, ExternalLink
} from 'lucide-react';
import { leadService, ProspectLead, isSupabaseConfigured } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import ScrollReveal from '@/components/ScrollReveal';

// Lista de nomes de empresas realistas por segmento para simulação inteligente
const MOCK_BUSINESS_TEMPLATES: Record<string, { names: string[], phones: string[] }> = {
  'Restaurantes & Cafés': {
    names: ['Sabor & Arte Gourmet', 'Café do Ponto Recife', 'Cantina Di Napoli', 'Espaço Grill & Cia', 'Bistrô Central', 'Panela de Barro', 'Estação do Sabor', 'Doce Aliança Confeitaria'],
    phones: ['81988776655', '81999887766', '81987654321', '81991223344', '81995554433', '81981112233']
  },
  'Oficinas & Serviços': {
    names: ['Auto Mecânica Express', 'Oficina do Alemão', 'Centro Automotivo Aliança', 'Motopeças Recife', 'Eletro Ar Condicionado', 'Funilaria e Pintura Silva', 'Borracharia 24h'],
    phones: ['81987112233', '81992334455', '81985443322', '81996778899', '81981229900']
  },
  'Estética & Beleza': {
    names: ['Studio de Beleza VIP', 'Espaço Mulher & Cia', 'Barbearia Imperial', 'Clínica de Estética Renovare', 'Salão Harmonia', 'Esmalteria Premium', 'Cílios & Sobrancelhas Design'],
    phones: ['81994556677', '81988110022', '81991334455', '81987556611', '81992887766']
  },
  'Saúde & Bem-Estar': {
    names: ['Consultório Odontológico Sorrir', 'Clínica Médica Vida', 'Espaço Pilates & Saúde', 'Fisioterapia Integrada', 'Nutrição Ativa', 'Drogaria Popular', 'Studio Funcional Fit'],
    phones: ['81995667788', '81986223344', '81991445566', '81988554433', '81993112233']
  },
  'Lojas & Comércio': {
    names: ['Mercadinho Preço Bom', 'Boutique Elegance', 'Pet Shop Amigo Fiel', 'Depósito de Bebidas Central', 'Ótica Visão Clara', 'Floricultura Florescer', 'Papelaria e Presentes'],
    phones: ['81997889900', '81985332211', '81992445566', '81988667788', '81991556677']
  }
};

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'prospector' | 'saved'>('prospector');
  const [cepOrAddress, setCepOrAddress] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Todos');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedLeads, setScannedLeads] = useState<Omit<ProspectLead, 'id' | 'created_at'>[]>([]);
  const [savedLeads, setSavedLeads] = useState<ProspectLead[]>([]);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  // Carregar leads salvos
  const loadSavedLeads = async () => {
    const leads = await leadService.getLeads();
    setSavedLeads(leads);
    
    // Inicializar notas de edição
    const notesMap: { [key: string]: string } = {};
    leads.forEach(lead => {
      notesMap[lead.id] = lead.notes || '';
    });
    setEditingNotes(notesMap);
  };

  useEffect(() => {
    loadSavedLeads();
  }, []);

  // Simular varredura do Google Maps por empresas sem website
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepOrAddress.trim()) {
      showError("Por favor, informe um CEP ou Endereço para buscar.");
      return;
    }

    setIsScanning(true);
    setScannedLeads([]);

    // Simular tempo de resposta da API do Google Places
    setTimeout(() => {
      const segmentsToScan = selectedSegment === 'Todos' 
        ? Object.keys(MOCK_BUSINESS_TEMPLATES) 
        : [selectedSegment];

      const results: Omit<ProspectLead, 'id' | 'created_at'>[] = [];

      segmentsToScan.forEach(segment => {
        const template = MOCK_BUSINESS_TEMPLATES[segment];
        // Selecionar de 2 a 4 empresas aleatórias por segmento para simular a busca local
        const count = Math.floor(Math.random() * 3) + 2;
        const shuffledNames = [...template.names].sort(() => 0.5 - Math.random());
        const shuffledPhones = [...template.phones].sort(() => 0.5 - Math.random());

        for (let i = 0; i < Math.min(count, shuffledNames.length); i++) {
          // Gerar um número de telefone realista
          const phone = shuffledPhones[i % shuffledPhones.length];
          // Gerar um endereço fictício baseado no CEP/Endereço digitado
          const streetNum = Math.floor(Math.random() * 900) + 100;
          const address = `${shuffledNames[i].split(' ')[0]} - Av. Principal, ${streetNum}, Região de ${cepOrAddress}`;

          results.push({
            name: shuffledNames[i],
            phone: phone,
            segment: segment,
            address: address,
            cep: cepOrAddress,
            has_website: false, // Foco em empresas SEM website
            status: 'Pendente',
            notes: ''
          });
        }
      });

      setScannedLeads(results);
      setIsScanning(false);
      showSuccess(`Varredura concluída! Encontramos ${results.length} empresas sem website nesta região.`);
    }, 2500);
  };

  // Salvar lead individual no Supabase / LocalStorage
  const handleSaveLead = async (lead: Omit<ProspectLead, 'id' | 'created_at'>, index: number) => {
    try {
      await leadService.saveLead(lead);
      showSuccess(`Empresa "${lead.name}" salva com sucesso!`);
      // Remover da lista de escaneados para evitar duplicidade visual
      setScannedLeads(prev => prev.filter((_, i) => i !== index));
      loadSavedLeads();
    } catch (err) {
      showError("Erro ao salvar lead.");
    }
  };

  // Salvar todos os leads escaneados de uma vez
  const handleSaveAll = async () => {
    if (scannedLeads.length === 0) return;
    try {
      for (const lead of scannedLeads) {
        await leadService.saveLead(lead);
      }
      showSuccess(`Todos os ${scannedLeads.length} leads foram salvos com sucesso!`);
      setScannedLeads([]);
      loadSavedLeads();
    } catch (err) {
      showError("Erro ao salvar todos os leads.");
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

  // Estatísticas rápidas
  const stats = {
    total: savedLeads.length,
    pending: savedLeads.filter(l => l.status === 'Pendente').length,
    contacted: savedLeads.filter(l => l.status === 'Contatado').length,
    scheduled: savedLeads.filter(l => l.status === 'Agendado').length,
  };

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
              <span className="text-xs uppercase tracking-[0.25em] text-[#00c868] font-bold font-mono">ACIOLI.LAB ADMIN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Painel de Prospecção Local
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Identifique empresas sem presença digital (sem website) no Google Maps para realizar abordagens comerciais de alto impacto.
            </p>
          </div>

          {/* Status da Conexão com o Supabase */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono ${
            isSupabaseConfigured 
              ? 'bg-[#00c868]/10 border-[#00c868]/30 text-[#00c868]' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Database className="w-4 h-4" />
            <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Local (LocalStorage)'}</span>
          </div>
        </div>

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
            Buscar Empresas (Google Maps)
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
            {/* Formulário de Busca */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-8 rounded-3xl">
              <form onSubmit={handleScan} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6 space-y-2">
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    CEP, Bairro ou Endereço de Busca
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: 51020-000, Boa Viagem, Recife"
                      value={cepOrAddress}
                      onChange={(e) => setCepOrAddress(e.target.value)}
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    Segmento de Atuação
                  </label>
                  <select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all cursor-pointer"
                  >
                    <option value="Todos" className="bg-zinc-950">Todos os Segmentos</option>
                    {Object.keys(MOCK_BUSINESS_TEMPLATES).map(seg => (
                      <option key={seg} value={seg} className="bg-zinc-950">{seg}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Buscar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Resultados da Busca */}
            {scannedLeads.length > 0 && (
              <ScrollReveal className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00c868] animate-pulse" />
                    Empresas sem Website Encontradas ({scannedLeads.length})
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#00c868]/30 bg-[#00c868]/10 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Todos na Lista</span>
                  </button>
                </div>

                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-400 text-xs font-mono uppercase tracking-wider">
                          <th className="p-4">Empresa</th>
                          <th className="p-4">Segmento</th>
                          <th className="p-4">Telefone</th>
                          <th className="p-4">Endereço</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-sm">
                        {scannedLeads.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/20 transition-colors">
                            <td className="p-4 font-bold text-white">{lead.name}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                                {lead.segment}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-zinc-300">
                              <a 
                                href={`tel:${lead.phone}`} 
                                className="hover:text-[#00c868] transition-colors flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#00c868]" />
                                {lead.phone}
                              </a>
                            </td>
                            <td className="p-4 text-zinc-500 text-xs max-w-xs truncate">{lead.address}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`https://wa.me/55${lead.phone}?text=Olá! Vi sua empresa no Google Maps e notei que vocês não possuem um website oficial. Gostaria de apresentar uma proposta de design premium.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#00c868] hover:border-[#00c868]/30 transition-all"
                                  title="Chamar no WhatsApp"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleSaveLead(lead, idx)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00c868]/10 border border-[#00c868]/20 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Salvar</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>
            )}

            {/* Estado Vazio */}
            {scannedLeads.length === 0 && !isScanning && (
              <div className="text-center py-16 border border-dashed border-zinc-900 rounded-3xl space-y-4">
                <Search className="w-12 h-12 text-zinc-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-zinc-400 font-medium">Nenhuma varredura ativa</p>
                  <p className="text-zinc-600 text-xs max-w-md mx-auto">
                    Informe um CEP ou endereço acima para buscar empresas locais que não possuem website vinculado ao Google Maps.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Aba de Leads Salvos */
          <div className="space-y-6">
            {savedLeads.length > 0 ? (
              <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-900/20 text-zinc-400 text-xs font-mono uppercase tracking-wider">
                        <th className="p-4">Empresa</th>
                        <th className="p-4">Segmento</th>
                        <th className="p-4">Contato</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Anotações / Histórico</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-sm">
                      {savedLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-zinc-900/10 transition-colors">
                          <td className="p-4">
                            <div className="space-y-1">
                              <p className="font-bold text-white">{lead.name}</p>
                              <p className="text-zinc-500 text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.cep}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                              {lead.segment}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <a 
                                href={`tel:${lead.phone}`} 
                                className="hover:text-[#00c868] transition-colors font-mono text-zinc-300 flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#00c868]" />
                                {lead.phone}
                              </a>
                              <a
                                href={`https://wa.me/55${lead.phone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-zinc-500 hover:text-[#00c868] transition-colors flex items-center gap-1"
                              >
                                WhatsApp Comercial
                              </a>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateStatus(lead.id, e.target.value as ProspectLead['status'])}
                              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${
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
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Adicionar anotação..."
                                value={editingNotes[lead.id] || ''}
                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                className="bg-zinc-900/40 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00c868] w-48"
                              />
                              <button
                                onClick={() => handleSaveNotes(lead.id, lead.status)}
                                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                                title="Salvar anotação"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                              title="Excluir Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-zinc-900 rounded-3xl space-y-4">
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