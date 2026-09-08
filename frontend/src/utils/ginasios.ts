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

export interface HorariosApresentacao {
  sub7: string;
  sub8: string;
  sub9: string;
  sub10: string;
}

export interface WhatsAppConfrontoParams {
  mandante: string;
  visitante: string;
  data?: string;
  hora?: string;
  ginasio?: string;
  rodada?: string;
  categoria?: string;
  // Campos customizáveis
  horariosApresentacao?: HorariosApresentacao;
  uniformeLinha?: string;
  uniformeGoleiro?: string;
  avisos?: string[];
  localPersonalizado?: string;
  enderecoPersonalizado?: string;
}

/**
 * Calcula automaticamente os horários de apresentação dos atletas com 1 hora de antecedência.
 * Padrão FPFS: Jogos sequenciais de Sub-7, Sub-8, Sub-9 e Sub-10 a cada 1 hora.
 */
export function calcularHorariosApresentacao(horaBase?: string): HorariosApresentacao {
  if (!horaBase) {
    return {
      sub7: '07:30h',
      sub8: '08:30h',
      sub9: '09:30h',
      sub10: '10:30h',
    };
  }

  const match = horaBase.match(/(\d{1,2})[:hH](\d{2})?/);
  if (!match) {
    return {
      sub7: '07:30h',
      sub8: '08:30h',
      sub9: '09:30h',
      sub10: '10:30h',
    };
  }

  const horaInt = parseInt(match[1], 10);
  const minStr = match[2] ? match[2].padStart(2, '0') : '00';

  const formatHora = (h: number) => {
    const horaAjustada = (h + 24) % 24;
    return `${String(horaAjustada).padStart(2, '0')}:${minStr}h`;
  };

  // Sub-7 joga na hora base -> Apresentação é 1h antes
  // Sub-8 joga 1h depois -> Apresentação é na hora base
  // Sub-9 joga 2h depois -> Apresentação é 1h após a base
  // Sub-10 joga 3h depois -> Apresentação é 2h após a base
  return {
    sub7: formatHora(horaInt - 1),
    sub8: formatHora(horaInt),
    sub9: formatHora(horaInt + 1),
    sub10: formatHora(horaInt + 2),
  };
}

/**
 * Sugestão padrão de uniformes para clubes tradicionais (customizável na UI).
 */
export function obterUniformePadrao(clube?: string): { linha: string; goleiro: string } {
  const c = (clube || '').toLowerCase();
  if (c.includes('pulo')) {
    return {
      linha: 'Camisa Amarela, shorts Amarelo, Meião Amarelo',
      goleiro: 'Camisa Preta, shorts Preto, Meião Preto',
    };
  }
  if (c.includes('palmeiras')) {
    return {
      linha: 'Camisa Verde, shorts Branco, Meião Verde',
      goleiro: 'Camisa Azul, shorts Azul, Meião Azul',
    };
  }
  if (c.includes('corinthians')) {
    return {
      linha: 'Camisa Branca, shorts Preto, Meião Branco',
      goleiro: 'Camisa Amarela, shorts Preto, Meião Preto',
    };
  }
  if (c.includes('santos')) {
    return {
      linha: 'Camisa Branca, shorts Branco, Meião Branco',
      goleiro: 'Camisa Azul, shorts Azul, Meião Azul',
    };
  }
  return {
    linha: 'Camisa Amarela, shorts Amarelo, Meião Amarelo',
    goleiro: 'Camisa Preta, shorts Preto, Meião Preto',
  };
}

/**
 * Gera a mensagem formatada para WhatsApp de convocação/divulgação da rodada no padrão exato solicitado.
 */
export function gerarTextoWhatsAppConfronto({
  mandante,
  visitante,
  data,
  hora,
  ginasio,
  rodada,
  horariosApresentacao,
  uniformeLinha,
  uniformeGoleiro,
  avisos,
  localPersonalizado,
  enderecoPersonalizado,
}: WhatsAppConfrontoParams): string {
  const ginasioInfo = resolverInfoGinasio(ginasio || 'Ginásio Oficial FPFS');
  const localFinal = localPersonalizado?.trim() || ginasioInfo.nomeOficial;
  const enderecoFinal =
    enderecoPersonalizado?.trim() ||
    `${ginasioInfo.endereco}${ginasioInfo.cidade ? ` - ${ginasioInfo.cidade}` : ''}`;

  const queryNavegacao = `${localFinal}, ${enderecoFinal}`;
  const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryNavegacao)}`;
  const linkWaze = `https://waze.com/ul?q=${encodeURIComponent(queryNavegacao)}&navigate=yes`;

  const rodadaTexto = rodada ? `🏆 ${rodada} • FPFS SÉRIE A1` : '🏆 FPFS SÉRIE A1 • INICIAÇÃO';
  const horarios = horariosApresentacao || calcularHorariosApresentacao(hora);
  const uLinha = uniformeLinha || obterUniformePadrao(mandante).linha;
  const uGoleiro = uniformeGoleiro || obterUniformePadrao(mandante).goleiro;

  const avisosPadrao = [
    '🚨 Levar todos os uniformes',
    '🚨 Não esquecer caneleira',
    '🚨 Não esquecer RG:  Original | Digital Gov | Cópia Autenticada',
  ];
  const avisosTexto = (avisos && avisos.length > 0 ? avisos : avisosPadrao).join('\n');

  const limparHora = (h: string) => (h.endsWith('h') ? h : `${h}h`);

  return (
    `${rodadaTexto}\n\n` +
    `⚽ INFORMAÇÕES DA RODADA\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚔️ ${mandante.toUpperCase()} 🆚 ${visitante.toUpperCase()}\n` +
    `📅 Data: ${data || 'A definir'}\n` +
    `⏰ Horário de Apresentação\n` +
    `\tSUB7:  ${limparHora(horarios.sub7)}\n` +
    `\tSUB8:  ${limparHora(horarios.sub8)}\n` +
    `\tSUB9:  ${limparHora(horarios.sub9)}\n` +
    `\tSUB10: ${limparHora(horarios.sub10)}\n\n` +
    `⚡Uniformes\n` +
    `\tLinha: ${uLinha}\n` +
    `\tGoleiro: ${uGoleiro}\n\n` +
    `📊 ATENÇÃO \n` +
    `${avisosTexto}\n\n\n` +
    `📍 Local do Jogo: ${localFinal}\n` +
    `🏢 Endereço: ${enderecoFinal}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🗺️ COMO CHEGAR (NAVEGAÇÃO):\n` +
    `* Google Maps: ${linkMaps}\n\n` +
    `* Waze: ${linkWaze}`
  );
}

/**
 * Abre o WhatsApp (Web no desktop ou App no celular) com o texto preenchido.
 */
export function abrirWhatsApp(texto: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
