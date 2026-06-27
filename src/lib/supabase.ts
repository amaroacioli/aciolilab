"use client";

// Configurações do Supabase vindas das variáveis de ambiente (suporta Vite e Next)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Interface para os Leads do RadarLocal
export interface RadarLead {
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
  grupo_importacao: string; // Ex: "Leads - 24/06/2026 14:00"
  status_prospeccao: 'Pendente' | 'Contatado' | 'Aguardando Resposta' | 'Fechado' | 'Sem Interesse';
  created_at?: string;
}

const LOCAL_STORAGE_KEY = 'radar_local_leads';

// Função auxiliar para fazer requisições HTTP seguras para a API REST do Supabase
async function supabaseFetch(path: string, options: RequestInit = {}) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase não configurado");
  }

  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Supabase: ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const leadService = {
  async getLeads(): Promise<RadarLead[]> {
    if (isSupabaseConfigured) {
      try {
        const data = await supabaseFetch('radar_leads?select=*&order=coletado_em.desc');
        if (data) return data as RadarLead[];
      } catch (e) {
        console.warn('Erro ao buscar do Supabase, usando LocalStorage:', e);
      }
    }
    
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveLeads(newLeads: RadarLead[]): Promise<RadarLead[]> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch('radar_leads', {
          method: 'POST',
          body: JSON.stringify(newLeads)
        });
        // Retorna a lista completa atualizada do banco de dados para garantir que o estado do painel mantenha todas as listas
        return await this.getLeads();
      } catch (e) {
        console.warn('Erro ao salvar no Supabase, salvando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = [...newLeads, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  async updateLead(id: string, updates: Partial<RadarLead>): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(`radar_leads?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        });
        return true;
      } catch (e) {
        console.warn('Erro ao atualizar no Supabase, atualizando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = current.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async renameGroup(oldName: string, newName: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(`radar_leads?grupo_importacao=eq.${encodeURIComponent(oldName)}`, {
          method: 'PATCH',
          body: JSON.stringify({ grupo_importacao: newName })
        });
        return true;
      } catch (e) {
        console.warn('Erro ao renomear grupo no Supabase, atualizando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = current.map(lead => 
      lead.grupo_importacao === oldName ? { ...lead, grupo_importacao: newName } : lead
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async deleteLead(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(`radar_leads?id=eq.${id}`, {
          method: 'DELETE'
        });
        return true;
      } catch (e) {
        console.warn('Erro ao deletar no Supabase, deletando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = current.filter(lead => lead.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async deleteGroup(groupName: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch(`radar_leads?grupo_importacao=eq.${encodeURIComponent(groupName)}`, {
          method: 'DELETE'
        });
        return true;
      } catch (e) {
        console.warn('Erro ao deletar grupo no Supabase, deletando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = current.filter(lead => lead.grupo_importacao !== groupName);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async clearAll(): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabaseFetch('radar_leads', {
          method: 'DELETE',
          headers: {
            'Prefer': 'count=exact'
          }
        });
        return true;
      } catch (e) {
        console.warn('Erro ao limpar Supabase:', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  }
};