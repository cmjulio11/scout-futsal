/**
 * Utilitários para formatação e sanitização de strings esportivas.
 */

/**
 * Garante que a rodada seja exibida perfeitamente como "Xª Rodada" (ex: "23ª Rodada"),
 * eliminando duplicações de caracteres ou artefatos de encoding como "2ª3ªª Rodada".
 */
export function formatarRodada(rodada?: string | number | null): string {
  if (!rodada) return '';
  const str = String(rodada);
  const nums = str.match(/\d+/g);
  if (nums && nums.length > 0) {
    const num = parseInt(nums.join(''), 10);
    return `${num}ª Rodada`;
  }
  return str.trim();
}

/**
 * Converte o nome do atleta para formato legível e completo
 * exibindo os dois primeiros nomes (ex: "Rafael Garza", "Luigi Scaraficci", "Daniel dos Reis"),
 * evitando cortes ou abreviações em cards compactos.
 */
export function formatarNomeAtletaCurto(nome?: string | null): string {
  if (!nome) return '';
  const parts = nome.trim().split(/\s+/);
  if (parts.length <= 2) {
    return parts
      .map((p) =>
        ['de', 'da', 'do', 'dos', 'das'].includes(p.toLowerCase())
          ? p.toLowerCase()
          : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
      )
      .join(' ');
  }

  const p0 = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  const p1Lower = parts[1].toLowerCase();
  if (['de', 'da', 'do', 'dos', 'das'].includes(p1Lower) && parts.length > 2) {
    const p2 = parts[2].charAt(0).toUpperCase() + parts[2].slice(1).toLowerCase();
    return `${p0} ${p1Lower} ${p2}`;
  }
  const p1 = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
  return `${p0} ${p1}`;
}

/**
 * Retorna o nome amigável e legível do clube para caber perfeitamente em cards sem truncamento.
 * Ex: "PALMEIRAS" -> "Palmeiras", "CORINTHIANS" -> "Corinthians"
 */
export function formatarNomeClubeCurto(clube?: string | null): string {
  if (!clube) return '';
  const c = clube.toUpperCase();
  if (c.includes('CORINTHIANS')) return 'Corinthians';
  if (c.includes('PALMEIRAS')) return 'Palmeiras';
  if (c.includes('SANTOS')) return 'Santos FC';
  if (c.includes('PAULO')) return 'São Paulo FC';
  if (c.includes('JUVENTUS')) return 'Juventus';
  if (c.includes('MAGNUS') || c.includes('ASF/')) return 'Magnus';
  if (c.includes('RSFC') || c.includes('CAETANO')) return 'São Caetano';
  if (c.includes('BATEBOLA')) return 'Batebola';
  if (c.includes('MESC')) return 'MESC';
  if (c.includes('TAUBAT')) return 'Taubaté';
  if (c.includes('YPIRANGA')) return 'Ypiranga';
  if (c.includes('PORTUGUESA')) return 'Portuguesa';
  if (c.includes('SANTO ANDR')) return 'Santo André';
  if (c.includes('AUDAX') || c.includes('OSASCO')) return 'Audax Osasco';
  if (c.includes('LAUSANNE')) return 'Lausanne';
  if (c.includes('HORTOL')) return 'Hortolândia';
  if (c.includes('INDAIATUBA')) return 'Indaiatuba';
  if (c.includes('ITAPEVI')) return 'Itapevi';
  if (c.includes('MOGI')) return 'Mogi';
  if (c.includes('TABUCA')) return 'Tabuca Jrs';
  if (c.includes('CAMISA 10')) return 'Camisa 10';
  if (c.includes('BOLA NO')) return 'Bola no Pé';
  if (c.includes('UNI') && c.includes('RD')) return 'União RD';
  if (c.includes('OLE BRASIL') || c.includes('OLÉ BRASIL') || c.includes('PUMAS')) return 'Olé Brasil';
  if (c.includes('GREMETAL')) return 'Gremetal';
  if (c.includes('GUARULHENSE')) return 'Guarulhense';
  if (c.includes('WIMPRO')) return 'Wimpro';
  if (c.includes('BATALHA')) return 'Batalha';
  if (c.includes('OCIAN')) return 'Ocian Praia';
  if (c.includes('OLIMPIK')) return 'AD Olimpik';

  return clube
    .split(/\s+/)
    .map((w) =>
      ['de', 'da', 'do', 'dos', 'das', 'e'].includes(w.toLowerCase())
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(' ');
}

/**
 * Formata a data e hora da última sincronização para exibição amigável e precisa:
 * Ex: "07/09 às 06:00h"
 */
export function formatarDataHoraSync(dataIso?: string | null): string {
  if (!dataIso) return 'Base local ativa';
  try {
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return 'Base local ativa';
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} às ${hora}:${min}h`;
  } catch {
    return 'Base local ativa';
  }
}

/**
 * Formata o próximo agendamento do cron:
 * Ex: "Hoje às 21:00h" ou "Amanhã às 06:00h" ou "08/09 às 06:00h"
 */
export function formatarProximoSync(dataIso?: string | null): string {
  if (!dataIso) return 'Diariamente às 06:00h';
  try {
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return 'Diariamente às 06:00h';
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    if (d.toDateString() === hoje.toDateString()) {
      return `Hoje às ${hora}:${min}h`;
    }
    if (d.toDateString() === amanha.toDateString()) {
      return `Amanhã às ${hora}:${min}h`;
    }
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes} às ${hora}:${min}h`;
  } catch {
    return 'Diariamente às 06:00h';
  }
}
