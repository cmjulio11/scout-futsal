/**
 * Guia de Ginásios & Logística de Deslocamento FPFS (Série A1 Iniciação)
 * Mapeamento dos principais ginásios de São Paulo, Grande SP, Litoral e Interior
 */

export interface GinasioInfo {
  nomeOficial: string;
  endereco: string;
  cidade: string;
  bairro?: string;
  referencia?: string;
}

// Dicionário de endereços oficiais dos ginásios mais utilizados pela FPFS
export const GINASIOS_CONHECIDOS: Record<string, GinasioInfo> = {
  'CIRO I': {
    nomeOficial: 'Ginásio Presidente Ciro I (FPFS)',
    endereco: 'Rua Penha, 233',
    bairro: 'Penha de França',
    cidade: 'São Paulo - SP',
    referencia: 'Sede da Federação Paulista de Futsal',
  },
  'CIRO II': {
    nomeOficial: 'Ginásio Presidente Ciro II (FPFS)',
    endereco: 'Rua Penha, 233',
    bairro: 'Penha de França',
    cidade: 'São Paulo - SP',
    referencia: 'Federação Paulista de Futsal (Ginásio Anexo)',
  },
  'WLAMIR MARQUES': {
    nomeOficial: 'Ginásio Poliesportivo Wlamir Marques (Corinthians)',
    endereco: 'Rua São Jorge, 777',
    bairro: 'Parque São Jorge / Tatuapé',
    cidade: 'São Paulo - SP',
    referencia: 'Parque São Jorge (S.C. Corinthians Paulista)',
  },
  'PARQUE SÃO JORGE': {
    nomeOficial: 'Mini Ginásio do Parque São Jorge (Corinthians)',
    endereco: 'Rua São Jorge, 777',
    bairro: 'Parque São Jorge / Tatuapé',
    cidade: 'São Paulo - SP',
    referencia: 'Complexo Esportivo do Corinthians',
  },
  'PALESTRA ITÁLIA': {
    nomeOficial: 'Ginásio Arena Palestra Itália (Palmeiras)',
    endereco: 'Rua Palestra Itália, 214',
    bairro: 'Perdizes',
    cidade: 'São Paulo - SP',
    referencia: 'S.E. Palmeiras (Prédio Poliesportivo / Allianz Parque)',
  },
  'JUVENTUS': {
    nomeOficial: 'Ginásio do Clube Atlético Juventus',
    endereco: 'Rua Comendador Roberto Ugolini, 20',
    bairro: 'Parque da Mooca',
    cidade: 'São Paulo - SP',
    referencia: 'Clube Atlético Juventus (Mooca)',
  },
  'MESC': {
    nomeOficial: 'Ginásio Clube MESC',
    endereco: 'Av. Robert Kennedy, 2113',
    bairro: 'Jardim Planalto',
    cidade: 'São Bernardo do Campo - SP',
    referencia: 'Clube MESC São Bernardo',
  },
  'YPIRANGA': {
    nomeOficial: 'Ginásio Cheidt Jafet (Clube Atlético Ypiranga)',
    endereco: 'Rua do Manifesto, 1485',
    bairro: 'Ipiranga',
    cidade: 'São Paulo - SP',
    referencia: 'Clube Atlético Ypiranga (CAY)',
  },
  'CHEIDT JAFET': {
    nomeOficial: 'Ginásio Cheidt Jafet (Clube Atlético Ypiranga)',
    endereco: 'Rua do Manifesto, 1485',
    bairro: 'Ipiranga',
    cidade: 'São Paulo - SP',
    referencia: 'Clube Atlético Ypiranga (CAY)',
  },
  'CONCORDIA': {
    nomeOficial: 'Arena Concórdia (Pulo Futsal Campinas)',
    endereco: 'Rod. Heitor Penteado, km 3,5',
    bairro: 'Sousas',
    cidade: 'Campinas - SP',
    referencia: 'Clube Semanal de Cultura Artística / Pulo Campinas',
  },
  'CLEMENTE MARCHIORI': {
    nomeOficial: 'Ginásio Clemente Marchiori (Taubaté Futsal)',
    endereco: 'Av. Walter Thaumaturgo, 269',
    bairro: 'Jardim das Nações',
    cidade: 'Taubaté - SP',
    referencia: 'Taubaté Country Club / Vila São José',
  },
  'VICTOR SAVALA': {
    nomeOficial: 'Ginásio Municipal Victor Savala',
    endereco: 'Rua Luiz Camilo de Camargo, 545',
    bairro: 'Jardim Rosolém',
    cidade: 'Hortolândia - SP',
    referencia: 'Parque Socioambiental / Hortolândia Futsal',
  },
  'JABAQUARA': {
    nomeOficial: 'Ginásio do Jabaquara Atlético Clube',
    endereco: 'Av. Francisco Ferreira Canto, 351',
    bairro: 'Caneleira',
    cidade: 'Santos - SP',
    referencia: 'Jabaquara A.C. (Litoral Paulista)',
  },
  'ACRE CLUBE': {
    nomeOficial: 'Ginásio ACRE Clube',
    endereco: 'Rua Maestro Gabriel Migliori, 235',
    bairro: 'Bairro do Limão / Tremembé',
    cidade: 'São Paulo - SP',
    referencia: 'Associação Cultural e Recreativa Esperança',
  },
  'SOROCABA': {
    nomeOficial: 'Arena Sorocaba',
    endereco: 'Rodovia Raposo Tavares, km 106',
    bairro: 'Parque Reserva Fazenda Imperial',
    cidade: 'Sorocaba - SP',
    referencia: 'Complexo Esportivo Arena Sorocaba',
  },
  'ARMANDO FREDIANI': {
    nomeOficial: 'Ginásio Poliesportivo Armando Frediani',
    endereco: 'Rua Parnaíba, 420',
    bairro: 'Jardim Parnaíba',
    cidade: 'Santana de Parnaíba - SP',
    referencia: 'Ginásio Municipal de Santana de Parnaíba',
  },
  'JOAQUIM CAMBAÚVA': {
    nomeOficial: 'Ginásio Poliesportivo Joaquim Cambaúva Rabello',
    endereco: 'Rua dos Meninos, 544',
    bairro: 'Nova Gerty',
    cidade: 'São Caetano do Sul - SP',
    referencia: 'Liga Sancaetanense / CER Arthur Garbelotto',
  },
  'DOMINGOS PITERI': {
    nomeOficial: 'Ginásio Poliesportivo Domingos Piteri',
    endereco: 'Rua Ciro dos Anjos, 100',
    bairro: 'Vila dos Remédios',
    cidade: 'Osasco - SP',
    referencia: 'Ginásio de Esportes de Osasco',
  },
  'AYRTON SENNA': {
    nomeOficial: 'Ginásio Ayrton Senna da Silva',
    endereco: 'Rua José Maciel Neto, 360',
    bairro: 'Jardim Maria Rosa',
    cidade: 'Taboão da Serra - SP',
    referencia: 'Tabuca Juniors / Taboão da Serra',
  },
  'BATEBOLA': {
    nomeOficial: 'Arena Batebola Sports',
    endereco: 'Av. Dr. Gastão Vidigal, 1946',
    bairro: 'Vila Leopoldina',
    cidade: 'São Paulo - SP',
    referencia: 'Complexo Esportivo Batebola',
  },
  'INDAIATUBA': {
    nomeOficial: 'Complexo Esportivo Morada do Sol',
    endereco: 'Estrada Municipal José Boldrini, s/n',
    bairro: 'Morada do Sol',
    cidade: 'Indaiatuba - SP',
    referencia: 'A.D. Indaiatuba / Morada do Sol',
  },
};

/**
 * Normaliza o nome do ginásio, corrigindo eventuais caracteres desconfigurados.
 */
export function limparNomeGinasio(nome: string): string {
  if (!nome) return 'Ginásio Oficial FPFS';
  return nome
    .replace(/GINSIO/gi, 'Ginásio')
    .replace(/GINASIO/gi, 'Ginásio')
    .replace(/SO/gi, 'São')
    .replace(/SAO/gi, 'São')
    .replace(/ITLIA/gi, 'Itália')
    .replace(/ITALIA/gi, 'Itália')
    .replace(/PEL/gi, 'Pelé')
    .replace(/TABOO/gi, 'Taboão')
    .replace(/METALRGICOS/gi, 'Metalúrgicos')
    .replace(/JOS/gi, 'José')
    .replace(/ANTO/gi, 'Antão')
    .replace(/CAMBAVA/gi, 'Cambaúva')
    .trim();
}

/**
 * Localiza informações ricas de endereço e cidade para o ginásio fornecido.
 */
export function resolverInfoGinasio(nome: string): GinasioInfo {
  const limpo = limparNomeGinasio(nome);
  const up = limpo.toUpperCase();

  for (const [chave, info] of Object.entries(GINASIOS_CONHECIDOS)) {
    if (up.includes(chave)) {
      return info;
    }
  }

  // Fallback genérico quando não consta no dicionário
  return {
    nomeOficial: limpo,
    endereco: limpo,
    cidade: 'São Paulo e Região - SP',
    referencia: 'Ginásio de Futsal credenciado pela FPFS',
  };
}

/**
 * Retorna o link de busca no Google Maps.
 */
export function obterLinkGoogleMaps(nomeGinasio: string): string {
  const info = resolverInfoGinasio(nomeGinasio);
  const query = `${info.nomeOficial}, ${info.endereco}, ${info.cidade}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Retorna o link para navegação direta no Waze.
 */
export function obterLinkWaze(nomeGinasio: string): string {
  const info = resolverInfoGinasio(nomeGinasio);
  const query = `${info.nomeOficial}, ${info.endereco}, ${info.cidade}`;
  return `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
}

export interface WhatsAppConfrontoParams {
  mandante: string;
  visitante: string;
  data?: string;
  hora?: string;
  ginasio?: string;
  rodada?: string;
  categoria?: string;
}

/**
 * Gera a mensagem formatada para WhatsApp de convocação/divulgação da rodada.
 */
export function gerarTextoWhatsAppConfronto({
  mandante,
  visitante,
  data,
  hora,
  ginasio,
  rodada,
  categoria,
}: WhatsAppConfrontoParams): string {
  const ginasioInfo = resolverInfoGinasio(ginasio || 'Ginásio Oficial FPFS');
  const linkMaps = obterLinkGoogleMaps(ginasio || 'Ginásio Oficial FPFS');
  const linkWaze = obterLinkWaze(ginasio || 'Ginásio Oficial FPFS');

  const rodadaTexto = rodada ? `🏆 *${rodada} • FPFS SÉRIE A1*` : '🏆 *CAMPEONATO PAULISTA DE INICIAÇÃO — FPFS*';
  const categoriaTexto = categoria && categoria !== 'geral' ? `[${categoria}] ` : '';

  return (
    `${rodadaTexto}\n\n` +
    `⚽ *CONVOCAÇÃO & GUIA DA RODADA*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚔️ *${categoriaTexto}${mandante}* 🆚 *${visitante}*\n` +
    `📅 *Data:* ${data || 'A confirmar'}\n` +
    `⏰ *Horário:* ${hora ? `${hora}h` : 'Horário FPFS'}\n` +
    `📍 *Local:* ${ginasioInfo.nomeOficial}\n` +
    `🏢 *Endereço:* ${ginasioInfo.endereco} - ${ginasioInfo.cidade}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🗺️ *COMO CHEGAR (NAVEGAÇÃO):*\n` +
    `• *Google Maps:* ${linkMaps}\n` +
    `• *Waze:* ${linkWaze}\n\n` +
    `⚡ *Quadro Completo de Jogos do Dia:*\n` +
    `• Sub-07 | Sub-08 | Sub-09 | Sub-10\n\n` +
    `📊 _Consulte o raio-x e artilharia no Intelligent Futsal Scout!_`
  );
}

/**
 * Abre o WhatsApp (Web no desktop ou App no celular) com o texto preenchido.
 */
export function abrirWhatsApp(texto: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
