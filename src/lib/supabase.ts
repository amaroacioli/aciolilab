// Configurações do Supabase vindas das variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Interface para os Leads de Prospecção
export interface ProspectLead {
  id: string;
  name: string;
  phone: string;
  segment: string;
  address: string;
  cep: string;
  has_website: boolean;
  status: 'Pendente' | 'Contatado' | 'Sem Interesse' | 'Agendado';
  notes?: string;
  created_at: string;
}

// Banco de dados local temporário para simulação e fallback
const LOCAL_STORAGE_KEY = 'acioli_admin_leads';

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
  async getLeads(): Promise<ProspectLead[]> {
    if (isSupabaseConfigured) {
      try {
        // GET /prospects?order=created_at.desc
        const data = await supabaseFetch('prospects?select=*&order=created_at.desc');
        if (data) return data as ProspectLead[];
      } catch (e) {
        console.warn('Erro ao buscar do Supabase, usando LocalStorage:', e);
      }
    }
    
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  async saveLead(lead: Omit<ProspectLead, 'id' | 'created_at'>): Promise<ProspectLead> {
    const newLead: ProspectLead = {
      ...lead,
      id: Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        // POST /prospects
        const data = await supabaseFetch('prospects', {
          method: 'POST',
          body: JSON.stringify(newLead)
        });
        if (data && data[0]) return data[0] as ProspectLead;
      } catch (e) {
        console.warn('Erro ao salvar no Supabase, salvando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = [newLead, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newLead;
  },

  async updateLeadStatus(id: string, status: ProspectLead['status'], notes?: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        // PATCH /prospects?id=eq.id
        await supabaseFetch(`prospects?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status, notes })
        });
        return true;
      } catch (e) {
        console.warn('Erro ao atualizar no Supabase, atualizando no LocalStorage:', e);
      }
    }

    const current = await this.getLeads();
    const updated = current.map(lead => 
      lead.id === id ? { ...lead, status, notes: notes !== undefined ? notes : lead.notes } : lead
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  },

  async deleteLead(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        // DELETE /prospects?id=eq.id
        await supabaseFetch(`prospects?id=eq.${id}`, {
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
  }
};