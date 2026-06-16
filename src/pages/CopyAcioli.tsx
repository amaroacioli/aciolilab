"use client";

import React, { useEffect } from 'react';

export default function CopyAcioli() {
  useEffect(() => {
    document.title = 'Amaro Acioli | Copy Trade Puma';

    const updateMetaTag = (attribute: 'property' | 'name', key: string, content: string) => {
      let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Open Graph
    updateMetaTag('property', 'og:title', 'Amaro Acioli | Copy Trade Puma');
    updateMetaTag('property', 'og:description', 'Acesso direto ao curso de copy trading com Amaro Acioli - Estratégias profissionais de trading e análise de mercado.');
    updateMetaTag('property', 'og:image', 'https://www.aciolilab.com.br/copy.png');
    updateMetaTag('property', 'og:image:secure_url', 'https://www.aciolilab.com.br/copy.png');
    updateMetaTag('property', 'og:image:type', 'image/png');
    updateMetaTag('property', 'og:image:width', '1200');
    updateMetaTag('property', 'og:image:height', '630');
    updateMetaTag('property', 'og:url', window.location.href);

    // Twitter
    updateMetaTag('name', 'twitter:title', 'Amaro Acioli | Copy Trade Puma');
    updateMetaTag('name', 'twitter:description', 'Acesso direto ao curso de copy trading com Amaro Acioli - Estratégias profissionais de trading e análise de mercado.');
    updateMetaTag('name', 'twitter:image', 'https://www.aciolilab.com.br/copy.png');

    // Redirecionamento instantâneo via replace
    window.location.replace('https://trade.pumabroker.com/register?ref=790MQ6WY5WVD');
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-zinc-100 font-sans antialiased">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-12 w-12 rounded-full border-2 border-[#00c868] border-t-transparent animate-spin" />
        <h1 className="text-lg font-bold text-white">Redirecionando para o Copy Trade Puma...</h1>
        <p className="mt-2 text-sm text-zinc-400">Se nada acontecer, aguarde alguns segundos ou clique no botão abaixo.</p>
        <a 
          href="https://trade.pumabroker.com/register?ref=790MQ6WY5WVD" 
          className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-[#00c868] hover:underline"
        >
          Clique aqui para se registrar
        </a>
      </div>
    </div>
  );
}