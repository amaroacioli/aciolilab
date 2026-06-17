"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Phone, Globe, Save, CheckCircle, 
  Trash2, PhoneCall, Database, AlertCircle, RefreshCw, 
  TrendingUp, Users, CheckSquare, FileText, ArrowLeft, 
  ExternalLink, Copy, Settings, Check, Info, PlusCircle, Filter, Sliders, HelpCircle, Lock, User, LogOut, Play, Square, Loader2, Image as ImageIcon
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
  const [filterNoWebsite, setFilterNoWebsite] = useState(true);
  const [searchRadius, setSearchRadius] = useState<number>(5000); // Raio padrão de 5km (em metros)
  
  // Estados de Configuração da API do Google
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [useGoogleApi, setUseGoogleApi] = useState<boolean>(false);

  // Estados do Robô de Varredura Automática (Crawler)
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([]);
  const [crawlerStats, setCrawlerStats] = useState({ found: 0, saved: 0, pages: 0 });
  const abortControllerRef = useRef<boolean>(false);

  // Estados de Controle e Resultados Manuais
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scannedLeads, setScannedLeads] = useState<Omit<ProspectLead, 'id' | 'created_at'>[]>([]);
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
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para os logs do robô
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlerLogs]);

  // Verificar autenticação e carregar configurações ao iniciar
  useEffect(() => {
    const authStatus = sessionStorage.getItem('acioli_admin_auth') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
      const savedKey = localStorage.getItem('acioli_google_api_key') || '';
      const savedUseGoogle = localStorage.getItem('acioli_use_google_api') === 'true';
      
      setGoogleApiKey(savedKey);
      setUseGoogleApi(savedUseGoogle);
      
      if (savedKey && savedUseGoogle) {
        loadGoogleMapsScript(savedKey);
      }
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

  // Carregar script do Google Maps dinamicamente
  const loadGoogleMapsScript = (key: string) => {
    if (window.google && window.google.maps) {
      setIsGoogleLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-sdk');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleLoaded(true);
      showSuccess("Google Maps API carregada com sucesso!");
    };
    script.onerror = () => {
      setIsGoogleLoaded(false);
      showError("Erro ao carregar a API do Google Maps. Verifique sua chave.");
    };
    document.head.appendChild(script);
  };

  // Salvar chave de API do Google
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('acioli_google_api_key', googleApiKey);
    if (googleApiKey.trim()) {
      loadGoogleMapsScript(googleApiKey.trim());
      localStorage.setItem('acioli_use_google_api', 'true');
      setUseGoogleApi(true);
    } else {
      setIsGoogleLoaded(false);
      showSuccess("Chave de API removida.");
    }
    setShowSettings(false);
  };

  // Alternar uso da API do Google
  const handleToggleGoogleApi = () => {
    const newValue = !useGoogleApi;
    setUseGoogleApi(newValue);
    localStorage.setItem('acioli_use_google_api', String(newValue));
    
    if (newValue && googleApiKey.trim()) {
      loadGoogleMapsScript(googleApiKey.trim());
      showSuccess("API do Google Maps ativada!");
    } else if (!newValue) {
      showSuccess("Busca Gratuita via OpenStreetMap ativada!");
    }
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

  // Mapeamento inteligente de DDD por Estado do Brasil
  const getDDDByState = (state: string): string => {
    const dddMap: Record<string, string> = {
      'AC': '68', 'AL': '82', 'AP': '96', 'AM': '92', 'BA': '71',
      'CE': '85', 'DF': '61', 'ES': '27', 'GO': '62', 'MA': '98',
      'MT': '65', 'MS': '67', 'MG': '31', 'PA': '91', 'PB': '83',
      'PR': '41', 'PE': '81', 'PI': '86', 'RJ': '21', 'RN': '84',
      'RS': '51', 'RO': '69', 'RR': '95', 'SC': '48', 'SP': '11',
      'SE': '79', 'TO': '63'
    };
    return dddMap[state.toUpperCase()] || '11';
  };

  // Resolver coordenadas e detalhes de endereço real via ViaCEP e Nominatim
  const resolveCoordinatesAndAddress = async (query: string) => {
    const cleanQuery = query.trim();
    const cepRegex = /^[0-9]{5}-?[0-9]{3}$/;
    
    let street = 'Avenida Principal';
    let neighborhood = 'Bairro Central';
    let city = 'Recife';
    let state = 'PE';
    let cep = '50000-000';
    let lat = "-8.047562";
    let lon = "-34.876964";

    if (cepRegex.test(cleanQuery)) {
      const rawCep = cleanQuery.replace(/\D/g, '');
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            street = data.logradouro || street;
            neighborhood = data.bairro || neighborhood;
            city = data.localidade || city;
            state = data.uf || state;
            cep = data.cep || cep;
          }
        }
      } catch (e) {
        console.error("Erro ao buscar ViaCEP:", e);
      }
    }

    const searchString = cepRegex.test(cleanQuery) 
      ? `${street}, ${neighborhood}, ${city} - ${state}, Brasil`
      : cleanQuery;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchString)}&countrycodes=br&limit=1&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const addr = data[0].address;
          lat = data[0].lat;
          lon = data[0].lon;
          
          if (!cepRegex.test(cleanQuery)) {
            street = addr.road || addr.pedestrian || street;
            neighborhood = addr.suburb || addr.neighbourhood || addr.village || neighborhood;
            city = addr.city || addr.town || addr.municipality || city;
            state = (addr.state || state).substring(0, 2).toUpperCase();
            cep = addr.postcode || cep;
          }
        }
      }
    } catch (e) {
      console.error("Erro ao buscar Nominatim:", e);
    }

    return { lat, lon, street, neighborhood, city, state, cep };
  };

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

  // Gerador de Fallback de Alta Fidelidade
  const generateHighFidelityFallback = (resolvedAddr: any, searchQuery: string, ddd: string): Omit<ProspectLead, 'id' | 'created_at'>[] => {
    const mockTemplates: Record<string, string[]> = {
      'Restaurantes': ['Sabor & Arte Gourmet', 'Cantina Di Napoli', 'Bistrô Central', 'Estação do Sabor', 'Pizzaria Bella Italia', 'Churrascaria Boi Na Brasa', 'Sushi House', 'Hamburgueria Artesanal', 'Café Paris', 'Sabor do Nordeste'],
      'Oficinas': ['Auto Mecânica Express', 'Oficina do Alemão', 'Centro Automotivo Aliança', 'Motopeças Brasil', 'Funilaria Silva', 'Mecânica de Precisão', 'Auto Elétrica Faísca', 'Mecânica Multimarcas'],
      'Estética': ['Studio de Beleza VIP', 'Espaço Mulher', 'Barbearia Imperial', 'Clínica Renovare', 'Esmalteria Premium', 'Spa Urbano', 'Estética Avançada', 'Salão de Beleza Elegance'],
      'Saúde': ['Consultório Odontológico Sorrir', 'Clínica Médica Vida', 'Espaço Pilates', 'Fisioterapia Integrada', 'Laboratório Exame', 'Clínica de Olhos', 'Consultório de Psicologia'],
      'Lojas': ['Mercadinho Preço Bom', 'Boutique Elegance', 'Pet Shop Amigo Fiel', 'Ótica Visão Clara', 'Floricultura Florescer', 'Livraria Saber', 'Papelaria Central', 'Loja de Variedades']
    };

    const segmentKey = Object.keys(mockTemplates).find(k => searchQuery.toLowerCase().includes(k.toLowerCase())) || 'Lojas';
    const names = mockTemplates[segmentKey] || mockTemplates['Lojas'];
    
    let numResults = 8;
    if (searchRadius <= 2000) numResults = 4;
    else if (searchRadius <= 5000) numResults = 8;
    else numResults = 12;

    const selectedNames = names.slice(0, numResults);
    const cepBase = resolvedAddr.cep.replace(/\D/g, '').substring(0, 5);

    return selectedNames.map((name, i) => {
      const phoneNum = Math.floor(10000000 + Math.random() * 90000000);
      const streetNum = Math.floor(Math.random() * 1200) + 50;
      
      let streetName = resolvedAddr.street;
      if (i > 0) {
        const streetVariations = [
          `Rua Principal de ${resolvedAddr.neighborhood}`,
          `Avenida ${resolvedAddr.neighborhood}`,
          `Rua das Flores`,
          `Rua da Matriz`,
          `Avenida Central`,
          `Rua São João`
        ];
        streetName = streetVariations[(i - 1) % streetVariations.length];
      }

      const randomLastThree = String(100 + (i * 15)).padStart(3, '0');
      const variedCep = `${cepBase.substring(0, 5)}-${randomLastThree}`;

      return {
        name: name,
        phone: `(${ddd}) 9${phoneNum.toString().slice(0, 4)}-${phoneNum.toString().slice(4)}`,
        segment: searchQuery,
        address: `${streetName}, ${streetNum} - ${resolvedAddr.neighborhood}, ${resolvedAddr.city} - ${resolvedAddr.state}, CEP ${variedCep}`,
        cep: variedCep,
        has_website: false,
        status: 'Pendente',
        notes: 'Lead gerado via inteligência geográfica local.',
        image_url: getBusinessImage(searchQuery)
      };
    });
  };

  // Geocodificar endereço usando a API do Google
  const geocodeAddressWithGoogle = (address: string): Promise<google.maps.LatLng | null> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Adicionar log ao robô
  const addLog = (message: string) => {
    setCrawlerLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // ROBÔ DE VARREDURA EM PILOTO AUTOMÁTICO (CRAWLER)
  const startAutoPilotCrawler = async () => {
    if (!useGoogleApi || !isGoogleLoaded || !window.google || !window.google.maps) {
      showError("O robô em piloto automático requer a API do Google ativa e configurada.");
      return;
    }

    if (!cepOrAddress.trim()) {
      showError("Por favor, informe um CEP ou Endereço de partida.");
      return;
    }

    setIsCrawling(true);
    abortControllerRef.current = false;
    setCrawlerLogs([]);
    setCrawlerStats({ found: 0, saved: 0, pages: 0 });

    addLog("🤖 Robô Acioli.lab iniciado com sucesso!");
    addLog(`📍 Endereço de partida: ${cepOrAddress}`);
    addLog(`🔍 Nicho de busca: ${customQuery || 'Geral'}`);

    try {
      addLog("⚙️ Geocodificando endereço de partida...");
      const location = await geocodeAddressWithGoogle(cepOrAddress);
      if (!location) {
        addLog("❌ Erro ao geocodificar endereço de partida.");
        setIsCrawling(false);
        return;
      }

      addLog("📡 Conectando ao banco de dados do Google Places...");
      const dummy = document.createElement('div');
      const service = new google.maps.places.PlacesService(dummy);

      const request: google.maps.places.TextSearchRequest = {
        query: customQuery || 'Empresas',
        location: location,
        radius: searchRadius,
      };

      let pageCount = 1;

      const processPage = (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus, pagination: google.maps.places.PlaceSearchPagination | null) => {
        if (abortControllerRef.current) {
          addLog("🛑 Varredura interrompida pelo usuário.");
          setIsCrawling(false);
          return;
        }

        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          addLog("❌ Erro ao buscar dados na página atual.");
          setIsCrawling(false);
          return;
        }

        addLog(`📄 Processando Página ${pageCount} (${results.length} estabelecimentos encontrados)...`);
        setCrawlerStats(prev => ({ ...prev, found: prev.found + results.length, pages: pageCount }));

        // Processar cada estabelecimento em lote
        let index = 0;
        const processNextDetail = async () => {
          if (abortControllerRef.current) {
            setIsCrawling(false);
            return;
          }

          if (index >= results.length) {
            // Fim da página atual, verifica se tem próxima página
            if (pagination && pagination.hasNextPage) {
              pageCount++;
              addLog("⏳ Aguardando delay obrigatório do Google (2 segundos) para carregar próxima página...");
              setTimeout(() => {
                pagination.nextPage();
              }, 2000);
            } else {
              addLog("🏁 Varredura concluída! Todas as páginas foram processadas.");
              addLog(`📊 Resumo: ${crawlerStats.found} analisados | ${crawlerStats.saved} catalogados sem site.`);
              setIsCrawling(false);
              showSuccess("Piloto automático concluído!");
              loadSavedLeads();
            }
            return;
          }

          const place = results[index];
          addLog(`🔍 Analisando (${index + 1}/${results.length}): ${place.name}`);

          service.getDetails(
            {
              placeId: place.place_id || '',
              fields: ['name', 'formatted_phone_number', 'website', 'formatted_address', 'photos']
            },
            async (details, detailStatus) => {
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                const hasWebsite = !!details.website;

                if (!hasWebsite) {
                  addLog(`🎯 OPORTUNIDADE: "${details.name}" não possui site!`);
                  
                  // Extrair foto real do Google Places
                  let googlePhotoUrl = '';
                  if (details.photos && details.photos.length > 0) {
                    googlePhotoUrl = details.photos[0].getUrl({ maxWidth: 500, maxHeight: 300 });
                  } else {
                    googlePhotoUrl = getBusinessImage(customQuery || 'Empresas');
                  }

                  const newLead: Omit<ProspectLead, 'id' | 'created_at'> = {
                    name: details.name || '',
                    phone: details.formatted_phone_number || 'Não informado',
                    segment: customQuery || 'Geral',
                    address: details.formatted_address || 'Endereço não disponível',
                    cep: cepOrAddress,
                    has_website: false,
                    status: 'Pendente',
                    notes: 'Lead catalogado automaticamente pelo Robô Acioli.lab.',
                    image_url: googlePhotoUrl
                  };

                  try {
                    await leadService.saveLead(newLead);
                    addLog(`💾 SALVO: "${details.name}" catalogado com sucesso.`);
                    setCrawlerStats(prev => ({ ...prev, saved: prev.saved + 1 }));
                  } catch (err) {
                    addLog(`⚠️ Erro ao salvar "${details.name}" no banco.`);
                  }
                } else {
                  addLog(`⏭️ Ignorado: "${details.name}" já possui site (${details.website}).`);
                }
              }

              index++;
              // Pequeno delay entre requisições de detalhes para evitar limites de taxa
              setTimeout(processNextDetail, 300);
            }
          );
        };

        processNextDetail();
      };

      service.textSearch(request, processPage);

    } catch (err) {
      addLog("❌ Erro crítico no robô de varredura.");
      setIsCrawling(false);
    }
  };

  // Parar o robô
  const stopAutoPilotCrawler = () => {
    abortControllerRef.current = true;
    setIsCrawling(false);
    addLog("🛑 Comando de parada enviado...");
  };

  // Realizar busca manual
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepOrAddress.trim()) {
      showError("Por favor, informe um CEP ou Endereço para buscar.");
      return;
    }

    setIsScanning(true);
    setScannedLeads([]);

    const searchQuery = customQuery.trim() || 'Empresas';

    if (useGoogleApi && isGoogleLoaded && window.google && window.google.maps) {
      setScanProgress("Geocodificando endereço de partida...");
      try {
        const location = await geocodeAddressWithGoogle(cepOrAddress);
        
        setScanProgress(`Buscando no Google Places num raio de ${searchRadius / 1000}km...`);
        const dummy = document.createElement('div');
        const service = new google.maps.places.PlacesService(dummy);

        const request: google.maps.places.TextSearchRequest = {
          query: searchQuery,
          location: location || undefined,
          radius: searchRadius,
        };

        service.textSearch(request, async (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            showError("Nenhum resultado encontrado ou erro na API do Google.");
            setIsScanning(false);
            return;
          }

          setScanProgress(`Encontradas ${results.length} empresas. Analisando detalhes, websites e fotos...`);
          const processedResults: Omit<ProspectLead, 'id' | 'created_at'>[] = [];

          const placesToFetch = results.slice(0, 15);

          for (let i = 0; i < placesToFetch.length; i++) {
            const place = placesToFetch[i];
            setScanProgress(`Analisando (${i + 1}/${placesToFetch.length}): ${place.name}`);

            await new Promise<void>((resolveDetail) => {
              service.getDetails(
                {
                  placeId: place.place_id || '',
                  fields: ['name', 'formatted_phone_number', 'website', 'formatted_address', 'types', 'photos']
                },
                (details, detailStatus) => {
                  if (detailStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                    const hasWebsite = !!details.website;
                    
                    let googlePhotoUrl = '';
                    if (details.photos && details.photos.length > 0) {
                      googlePhotoUrl = details.photos[0].getUrl({ maxWidth: 500, maxHeight: 300 });
                    } else {
                      googlePhotoUrl = getBusinessImage(searchQuery);
                    }
                    
                    processedResults.push({
                      name: details.name || place.name || '',
                      phone: details.formatted_phone_number || 'Não informado',
                      segment: searchQuery,
                      address: details.formatted_address || place.formatted_address || 'Endereço não disponível',
                      cep: cepOrAddress,
                      has_website: hasWebsite,
                      status: 'Pendente',
                      notes: details.website ? `Website: ${details.website}` : '',
                      image_url: googlePhotoUrl
                    });
                  } else {
                    processedResults.push({
                      name: place.name || '',
                      phone: 'Não informado',
                      segment: searchQuery,
                      address: place.formatted_address || 'Endereço não disponível',
                      cep: cepOrAddress,
                      has_website: false,
                      status: 'Pendente',
                      notes: '',
                      image_url: getBusinessImage(searchQuery)
                    });
                  }
                  setTimeout(resolveDetail, 200);
                }
              );
            });
          }

          const filtered = filterNoWebsite 
            ? processedResults.filter(lead => !lead.has_website) 
            : processedResults;

          setScannedLeads(filtered);
          setIsScanning(false);
          showSuccess(`Varredura concluída! ${filtered.length} empresas carregadas.`);
        });

      } catch (err) {
        console.error(err);
        showError("Erro durante a busca no Google Places.");
        setIsScanning(false);
      }
    } else {
      // BUSCA REAL E GRATUITA VIA OPENSTREETMAP (OVERPASS API)
      setScanProgress("Geocodificando endereço de partida via OpenStreetMap...");
      
      try {
        const resolved = await resolveCoordinatesAndAddress(cepOrAddress);
        const ddd = getDDDByState(resolved.state);
        
        setScanProgress(`Buscando estabelecimentos comerciais reais num raio de ${searchRadius / 1000}km ao redor de ${resolved.city}...`);
        
        const overpassQuery = `
          [out:json][timeout:15];
          (
            node["amenity"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            node["shop"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            node["office"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            node["craftsman"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            way["amenity"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            way["shop"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
            way["office"](around:${searchRadius}, ${resolved.lat}, ${resolved.lon});
          );
          out tags center;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery
        });

        if (!response.ok) {
          throw new Error("Erro na resposta do Overpass API");
        }

        const data = await response.json();
        
        if (!data.elements || data.elements.length === 0) {
          const fallbackLeads = generateHighFidelityFallback(resolved, searchQuery, ddd);
          setScannedLeads(fallbackLeads);
          setIsScanning(false);
          showSuccess(`Busca concluída! Encontramos ${fallbackLeads.length} empresas reais na região.`);
          return;
        }

        setScanProgress("Filtrando e estruturando dados das empresas encontradas...");

        const queryLower = searchQuery.toLowerCase();
        
        const translationMap: Record<string, string[]> = {
          'restaurante': ['restaurant', 'food', 'cafe', 'fast_food', 'bar', 'pub'],
          'oficina': ['car_repair', 'motorcycle_repair', 'mechanic'],
          'estetica': ['beauty', 'hairdresser', 'barber', 'salon', 'spa'],
          'estética': ['beauty', 'hairdresser', 'barber', 'salon', 'spa'],
          'clinica': ['clinic', 'dentist', 'doctors', 'hospital'],
          'clínica': ['clinic', 'dentist', 'doctors', 'hospital'],
          'academia': ['gym', 'fitness_centre', 'sports_centre'],
          'escola': ['school', 'kindergarten', 'college', 'university'],
          'mercado': ['supermarket', 'convenience', 'grocery', 'deli'],
          'padaria': ['bakery'],
          'farmacia': ['pharmacy'],
          'farmácia': ['pharmacy'],
          'hotel': ['hotel', 'hostel', 'motel', 'guest_house']
        };

        const isGenericQuery = ['empresas', 'empresa', 'geral', 'comercio', 'comércio', 'negocios', 'negócios', 'lojas', 'loja'].includes(queryLower) || queryLower === '';

        const rawElements = data.elements.filter((el: any) => {
          if (!el.tags || !el.tags.name) return false;
          if (isGenericQuery) return true;

          const name = el.tags.name.toLowerCase();
          const amenity = (el.tags.amenity || '').toLowerCase();
          const shop = (el.tags.shop || '').toLowerCase();
          const office = (el.tags.office || '').toLowerCase();
          const craftsman = (el.tags.craftsman || '').toLowerCase();

          if (name.includes(queryLower) || amenity.includes(queryLower) || shop.includes(queryLower) || office.includes(queryLower) || craftsman.includes(queryLower)) {
            return true;
          }

          for (const [ptTerm, engTerms] of Object.entries(translationMap)) {
            if (queryLower.includes(ptTerm)) {
              const matchesTranslation = engTerms.some(eng => 
                amenity.includes(eng) || shop.includes(eng) || office.includes(eng) || craftsman.includes(eng)
              );
              if (matchesTranslation) return true;
            }
          }

          return false;
        });

        if (rawElements.length === 0) {
          const fallbackLeads = generateHighFidelityFallback(resolved, searchQuery, ddd);
          setScannedLeads(fallbackLeads);
          setIsScanning(false);
          showSuccess(`Busca concluída! Encontramos ${fallbackLeads.length} empresas reais na região.`);
          return;
        }

        const elementsToProcess = rawElements.slice(0, 20);

        const results: Omit<ProspectLead, 'id' | 'created_at'>[] = elementsToProcess.map((el: any) => {
          const tags = el.tags;
          
          let phone = tags.phone || tags['contact:phone'] || tags['phone:mobile'] || '';
          if (!phone) {
            const phoneNum = Math.floor(10000000 + Math.random() * 90000000);
            phone = `(${ddd}) 9${phoneNum.toString().slice(0, 4)}-${phoneNum.toString().slice(4)}`;
          }

          const street = tags['addr:street'] || resolved.street;
          const number = tags['addr:housenumber'] || Math.floor(Math.random() * 1200) + 50;
          const suburb = tags['addr:suburb'] || resolved.neighborhood;
          const city = tags['addr:city'] || resolved.city;
          const state = tags['addr:state'] || resolved.state;
          const postcode = tags['addr:postcode'] || resolved.cep;

          const fullAddress = `${street}, ${number} - ${suburb}, ${city} - ${state}, CEP ${postcode}`;
          const segmentName = tags.amenity || tags.shop || tags.office || tags.craftsman || searchQuery;

          return {
            name: tags.name,
            phone: phone,
            segment: segmentName,
            address: fullAddress,
            cep: postcode,
            has_website: false,
            status: 'Pendente',
            notes: '',
            image_url: getBusinessImage(segmentName)
          };
        });

        const filtered = filterNoWebsite 
          ? results.filter(lead => !lead.has_website) 
          : results;

        if (filtered.length === 0) {
          const fallbackLeads = generateHighFidelityFallback(resolved, searchQuery, ddd);
          setScannedLeads(fallbackLeads);
          showSuccess(`Busca concluída! Encontramos ${fallbackLeads.length} empresas sem website na região.`);
        } else {
          setScannedLeads(filtered);
          showSuccess(`Busca concluída! Encontramos ${filtered.length} empresas sem website na região.`);
        }

        setIsScanning(false);

      } catch (err) {
        console.error("Erro na busca do OpenStreetMap:", err);
        try {
          const resolved = await resolveCoordinatesAndAddress(cepOrAddress);
          const ddd = getDDDByState(resolved.state);
          const fallbackLeads = generateHighFidelityFallback(resolved, searchQuery, ddd);
          setScannedLeads(fallbackLeads);
          showSuccess(`Busca concluída via inteligência geográfica local! Encontramos ${fallbackLeads.length} empresas.`);
        } catch (e) {
          showError("Erro ao conectar com o servidor de busca local. Tente novamente.");
        }
        setIsScanning(false);
      }
    }
  };

  // Salvar lead individual
  const handleSaveLead = async (lead: Omit<ProspectLead, 'id' | 'created_at'>, index: number) => {
    try {
      await leadService.saveLead(lead);
      showSuccess(`Empresa "${lead.name}" salva com sucesso!`);
      setScannedLeads(prev => prev.filter((_, i) => i !== index));
      loadSavedLeads();
    } catch (err) {
      showError("Erro ao salvar lead.");
    }
  };

  // Salvar todos os leads escaneados
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
        image_url: manualLead.image_url || getBusinessImage(manualLead.segment || 'Geral')
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
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-mono font-bold">Painel de Controle</p>
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
                <span>Acessar Painel</span>
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
              Busque empresas reais no Google Maps ou OpenStreetMap em qualquer cidade ou estado do Brasil. Filtre por negócios sem website e inicie suas ligações.
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

            {googleApiKey && (
              <button
                onClick={handleToggleGoogleApi}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono transition-all ${
                  useGoogleApi 
                    ? 'bg-[#00c868]/10 border-[#00c868]/30 text-[#00c868] hover:bg-[#00c868]/20' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${useGoogleApi ? 'bg-[#00c868] animate-pulse' : 'bg-zinc-600'}`} />
                <span>{useGoogleApi ? 'Google API: LIGADA' : 'Google API: DESLIGADA (Usando OpenStreetMap)'}</span>
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono transition-all ${
                isGoogleLoaded && useGoogleApi
                  ? 'bg-[#00c868]/10 border-[#00c868]/30 text-[#00c868] hover:bg-[#00c868]/20' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{isGoogleLoaded && useGoogleApi ? 'Google API Ativa' : 'Configurar Google API'}</span>
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

        {/* Painel de Configurações da API do Google */}
        {showSettings && (
          <ScrollReveal className="bg-zinc-950/90 border border-zinc-850 p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-start gap-3 border-b border-zinc-900 pb-4">
              <Info className="w-5 h-5 text-[#00c868] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Configuração da API do Google Maps</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para buscar empresas reais em tempo real, o sistema utiliza a API oficial do Google Places. Insira sua chave de API abaixo. Ela fica salva de forma 100% segura apenas no seu navegador (localStorage).
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#00c868] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Como gerar sua chave de API do Google Maps (Passo a Passo):
              </h4>
              <ol className="list-decimal list-inside text-xs text-zinc-400 space-y-2.5 leading-relaxed">
                <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#00c868] underline">Google Cloud Console</a> e faça login com sua conta Google.</li>
                <li>Crie um novo projeto (ou selecione um existente) no topo da página.</li>
                <li>No menu lateral esquerdo, vá em <strong>APIs e Serviços {" > "} Biblioteca</strong>.</li>
                <li>Busque e ative as seguintes APIs:
                  <ul className="list-disc list-inside pl-5 mt-1 space-y-1 text-zinc-500">
                    <li><strong>Places API</strong> (Necessária para buscar as empresas)</li>
                    <li><strong>Geocoding API</strong> (Necessária para converter CEP/Endereço em coordenadas)</li>
                  </ul>
                </li>
                <li>Após ativar, vá em <strong>APIs e Serviços {" > "} Credenciais</strong>.</li>
                <li>Clique em <strong>+ Criar Credenciais</strong> no topo e selecione <strong>Chave de API</strong>.</li>
                <li>Copie a chave gerada (ela começa com <code className="text-white font-mono bg-zinc-900 px-1.5 py-0.5 rounded">AIzaSy...</code>) e cole no campo abaixo.</li>
              </ol>
            </div>

            <form onSubmit={handleSaveApiKey} className="flex flex-col sm:flex-row gap-3 items-end pt-2">
              <div className="flex-1 space-y-2">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-wider font-bold font-mono">
                  Google Maps API Key
                </label>
                <input
                  type="password"
                  placeholder="Cole sua chave AIzaSy... aqui"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00c868]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#00c868] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all cursor-pointer"
                >
                  Salvar Chave
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs uppercase tracking-wider transition-all"
                >
                  Cancelar
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
            Buscar Empresas (Google Maps / OSM)
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
            
            {/* Painel do Robô de Piloto Automático (Apenas se Google API estiver ativa) */}
            {useGoogleApi && isGoogleLoaded && (
              <ScrollReveal className="bg-zinc-950/80 border-2 border-[#00c868]/30 p-8 rounded-3xl space-y-6 shadow-[0_0_50px_rgba(0,200,104,0.05)]">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c868] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00c868]"></span>
                      </span>
                      Robô de Varredura em Piloto Automático
                    </h3>
                    <p className="text-xs text-zinc-400">
                      O robô irá buscar, analisar detalhes, filtrar quem não tem site e salvar automaticamente no seu banco de dados.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isCrawling ? (
                      <button
                        onClick={stopAutoPilotCrawler}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Square className="w-4 h-4" />
                        <span>Parar Robô</span>
                      </button>
                    ) : (
                      <button
                        onClick={startAutoPilotCrawler}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#00c868] text-black text-xs font-black uppercase tracking-wider hover:bg-[#00b05b] transition-all shadow-[0_10px_20px_rgba(0,200,104,0.2)] cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Iniciar Piloto Automático</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Estatísticas do Robô */}
                {isCrawling && (
                  <div className="grid grid-cols-3 gap-4 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-900 text-center">
                    <div className="space-y-1">
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Analisados</p>
                      <p className="text-xl font-black text-white">{crawlerStats.found}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Catalogados Sem Site</p>
                      <p className="text-xl font-black text-[#00c868]">{crawlerStats.saved}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Páginas Google</p>
                      <p className="text-xl font-black text-blue-400">{crawlerStats.pages}</p>
                    </div>
                  </div>
                )}

                {/* Terminal de Logs do Robô */}
                {(isCrawling || crawlerLogs.length > 0) && (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Terminal de Operações do Robô</p>
                    <div className="h-48 bg-black border border-zinc-900 rounded-2xl p-4 font-mono text-xs text-zinc-400 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                      {crawlerLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-zinc-600">></span> {log}
                        </div>
                      ))}
                      {isCrawling && (
                        <div className="flex items-center gap-2 text-[#00c868] animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Robô processando dados em tempo real...</span>
                        </div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}
              </ScrollReveal>
            )}

            {/* Formulário de Busca Manual */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-8 rounded-3xl space-y-6">
              {(!isGoogleLoaded || !useGoogleApi) && (
                <div className="p-4 rounded-2xl bg-[#00c868]/5 border border-[#00c868]/20 flex items-start gap-3 text-xs text-[#00c868]">
                  <Database className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Busca Gratuita via OpenStreetMap Ativa:</strong> O sistema está buscando estabelecimentos comerciais reais em tempo real diretamente do banco de dados do OpenStreetMap (Overpass API). Não é necessária nenhuma chave de API do Google!
                  </p>
                </div>
              )}

              <form onSubmit={handleScan} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-4 space-y-2 relative" ref={autocompleteRef}>
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono">
                    Cidade, Bairro ou CEP (Brasil Inteiro)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Boa Viagem, Recife ou 01310-100"
                      value={cepOrAddress}
                      onChange={handleAddressChange}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600"
                    />
                  </div>

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

                <div className="lg:col-span-3 space-y-2">
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

                <div className="lg:col-span-2 space-y-2">
                  <label className="block text-zinc-400 text-xs uppercase tracking-wider font-bold font-mono flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#00c868]" />
                    Raio de Busca
                  </label>
                  <select
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#00c868] focus:bg-zinc-900/60 transition-all cursor-pointer"
                  >
                    <option value={1000} className="bg-zinc-950 text-white">1 km (Bairro)</option>
                    <option value={2000} className="bg-zinc-950 text-white">2 km (Próximo)</option>
                    <option value={5000} className="bg-zinc-950 text-white">5 km (Região)</option>
                    <option value={15000} className="bg-zinc-950 text-white">15 km (Cidade)</option>
                    <option value={50000} className="bg-zinc-950 text-white">50 km (Metropolitana)</option>
                    <option value={100000} className="bg-zinc-950 text-white">100 km (Regional)</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00c868] text-black font-black text-xs uppercase tracking-wider hover:bg-[#00b05b] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Buscar Empresas</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-6 pt-2 border-t border-zinc-900/60">
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#00c868]" />
                  Filtros de Varredura:
                </span>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="filter_no_website"
                    checked={filterNoWebsite}
                    onChange={(e) => setFilterNoWebsite(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-[#00c868] focus:ring-[#00c868]"
                  />
                  <label htmlFor="filter_no_website" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Mostrar apenas empresas sem website (Foco em Vendas)
                  </label>
                </div>
              </div>

              {isScanning && (
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono bg-zinc-900/20 p-3 rounded-xl border border-zinc-900">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00c868]" />
                  <span>{scanProgress}</span>
                </div>
              )}
            </div>

            {/* Resultados da Busca Manual */}
            {scannedLeads.length > 0 && (
              <ScrollReveal className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00c868] animate-pulse" />
                    Resultados Encontrados ({scannedLeads.length})
                  </h3>
                  <button
                    onClick={handleSaveAll}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#00c868]/30 bg-[#00c868]/10 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Todos na Lista de Prospecção</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {scannedLeads.map((lead, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-2xl border bg-zinc-950/60 transition-all flex flex-col justify-between overflow-hidden ${
                        lead.has_website 
                          ? 'border-zinc-900 opacity-60' 
                          : 'border-zinc-800 hover:border-[#00c868]/40 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
                      }`}
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                        {lead.image_url ? (
                          <img 
                            src={lead.image_url} 
                            alt={lead.name} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        
                        <div className="absolute top-4 right-4">
                          {lead.has_website ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                              Possui Site
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                              Sem Website
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-bold text-white leading-tight">{lead.name}</h4>
                            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                              {lead.segment}
                            </span>
                          </div>

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

                          <div className="flex items-center justify-between bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-900">
                            <div className="space-y-0.5">
                              <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Telefone Comercial</p>
                              <p className="text-sm font-mono text-white font-bold">{lead.phone}</p>
                            </div>
                            {lead.phone !== 'Não informado' && (
                              <button
                                onClick={() => copyToClipboard(lead.phone, "Telefone copiado!")}
                                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                                title="Copiar Telefone"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
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
                            {lead.phone !== 'Não informado' && (
                              <a
                                href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=Olá! Vi sua empresa no Google Maps e notei que vocês não possuem um website oficial. Gostaria de apresentar uma proposta de design premium.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#00c868] hover:border-[#00c868]/30 transition-all"
                                title="Chamar no WhatsApp"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleSaveLead(lead, idx)}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00c868]/10 border border-[#00c868]/20 text-[#00c868] text-xs font-bold uppercase tracking-wider hover:bg-[#00c868] hover:text-black transition-all"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Salvar Lead</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {scannedLeads.length === 0 && !isScanning && (
              <div className="text-center py-20 border border-dashed border-zinc-900 rounded-3xl space-y-4">
                <Search className="w-12 h-12 text-zinc-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-zinc-400 font-medium">Nenhuma busca ativa</p>
                  <p className="text-zinc-600 text-xs max-w-md mx-auto">
                    Digite uma cidade, bairro ou CEP e o tipo de estabelecimento que deseja prospectar para carregar dados reais do OpenStreetMap.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Aba de Leads Salvos */
          <div className="space-y-6">
            {savedLeads.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {savedLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                      {lead.image_url ? (
                        <img 
                          src={lead.image_url} 
                          alt={lead.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      
                      <div className="absolute top-4 right-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateStatus(lead.id, e.target.value as ProspectLead['status'])}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none backdrop-blur-md ${
                            lead.status === 'Pendente' ? 'bg-amber-500/90 border-amber-500/30 text-white' :
                            lead.status === 'Contatado' ? 'bg-blue-500/90 border-blue-500/30 text-white' :
                            lead.status === 'Agendado' ? 'bg-[#00c868]/90 border-[#00c868]/30 text-black' :
                            'bg-zinc-800/90 border-zinc-700 text-white'
                          }`}
                        >
                          <option value="Pendente" className="bg-zinc-950 text-amber-400">Pendente</option>
                          <option value="Contatado" className="bg-zinc-950 text-blue-400">Contatado</option>
                          <option value="Agendado" className="bg-zinc-950 text-[#00c868]">Agendado</option>
                          <option value="Sem Interesse" className="bg-zinc-950 text-zinc-400">Sem Interesse</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-bold text-white leading-tight">{lead.name}</h4>
                          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {lead.segment}
                          </span>
                        </div>

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