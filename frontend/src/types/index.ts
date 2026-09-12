export type Perfil = 'administrador' | 'comissao_tecnica';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  clube?: string | null;
  clube_escudo_url?: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface ClassificacaoItem {
  posicao: number;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  clube: string;
  escudo_url: string;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo_gols: number;
  average: number;
}

export interface RankingEficienciaItem {
  posicao: number;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  clube: string;
  escudo_url: string;
  indice_tecnico: number;
  pontos_total: number;
  jogos_total: number;
  vitorias_total: number;
  empates_total: number;
  derrotas_total: number;
  gols_pro_total: number;
  gols_contra_total: number;
  saldo_gols_total: number;
  average: number;
  pontos_por_categoria: { [key: string]: number };
  zona_rebaixamento?: boolean;
}

export interface JogoItem {
  data: string;
  dia?: string;
  mes?: string;
  ano?: string;
  hora: string;
  ginasio: string;
  mandante: string;
  mandante_completo?: string;
  escudo_mandante: string;
  placar_mandante: number | null;
  placar_visitante: number | null;
  visitante: string;
  visitante_completo?: string;
  escudo_visitante: string;
  status: string;
  rodada?: string;
  rodada_num?: number;
  sumula_url: string | null;
  categoria?: string;
}

export interface ConfrontoCategoriaItem {
  categoria: string;
  hora: string;
  placar_mandante: number | null;
  placar_visitante: number | null;
  status: string;
  sumula_url: string | null;
}

export interface ConfrontoItem {
  id: string;
  data: string;
  dia?: string;
  mes?: string;
  ano?: string;
  mandante: string;
  mandante_completo?: string;
  escudo_mandante: string;
  visitante: string;
  visitante_completo?: string;
  escudo_visitante: string;
  ginasio: string;
  rodada?: string;
  rodada_num?: number;
  status_geral: 'aovivo' | 'encerrado' | 'agendado';
  categorias: Record<string, ConfrontoCategoriaItem>;
}

export interface ArtilheiroItem {
  posicao: number;
  nome: string;
  foto_url: string | null;
  clube: string;
  clube_completo?: string;
  escudo_url: string;
  gols: number;
  id_jogador?: number;
  id_fase?: number;
}

export interface ScoutClubeItem {
  nome: string;
  nome_completo: string;
  escudo_url: string;
  posicao: number;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  pontos_total: number;
  indice_tecnico: number;
}

export interface PartidaRodadaItem {
  data: string;
  dia?: string;
  mes?: string;
  hora: string;
  rodada?: string;
  ginasio: string;
  mandante: string;
  escudo_mandante: string;
  visitante: string;
  escudo_visitante: string;
  status: string;
}

export interface EstatisticasMandoItem {
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo_gols: number;
  pontos: number;
  aproveitamento: number;
  media_gols_pro: number;
  media_gols_contra: number;
}

export interface JogoRecenteScoutItem {
  data: string;
  dia?: string;
  mes?: string;
  categoria: string;
  rodada?: string;
  ginasio: string;
  mando: 'Casa' | 'Fora';
  placar: string;
  gols_pro: number;
  gols_contra: number;
  resultado: 'V' | 'E' | 'D';
  adversario: string;
  adversario_escudo: string;
  adversario_posicao: number | null;
  adversario_chave: 'OURO' | 'PRATA' | 'BRONZE';
  sumula_url?: string | null;
}

export interface SubCategoriaScoutItem {
  categoria: string;
  mandante: ClassificacaoItem | null;
  visitante: ClassificacaoItem | null;
}

export interface ConfrontoClubeInfo extends RankingEficienciaItem {
  diferenca_lider: number;
  margem_rebaixamento: number;
  status_rebaixamento: 'Livre' | 'Na Zona';
}

export interface AmeacaArtilheiroItem extends ArtilheiroItem {
  categoria?: string;
  marcou_contra_adversario: boolean;
  gols_contra_adversario: number;
}

export interface ConfrontoClubeData {
  info: ConfrontoClubeInfo;
  estatisticas_mando: {
    casa: EstatisticasMandoItem;
    fora: EstatisticasMandoItem;
  };
  ultimos_jogos: JogoRecenteScoutItem[];
  principais_artilheiros?: AmeacaArtilheiroItem[];
}

export interface ConfrontoScoutResponse {
  temporada: number;
  categoria: string | null;
  mandante: ConfrontoClubeData;
  visitante: ConfrontoClubeData;
  sub_categorias: SubCategoriaScoutItem[];
  confronto_direto: JogoItem[];
}

export interface GolJogoAtleta {
  rodada: string;
  data: string;
  hora: string;
  mando: 'Casa' | 'Fora';
  mandante: string;
  escudo_mandante: string;
  visitante: string;
  escudo_visitante: string;
  placar: string;
  gols_atleta: number;
  adversario: string;
  adversario_escudo: string;
  adversario_posicao: number | null;
  adversario_chave: 'OURO' | 'PRATA' | 'BRONZE';
  ginasio: string;
}

export interface MaiorVitimaAtleta {
  adversario: string;
  escudo_url: string;
  posicao: number | null;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  gols: number;
  jogos: number;
}

export interface FichaAtletaResponse {
  atleta: {
    id_jogador: number;
    id_fase: number;
    nome: string;
    foto_url: string | null;
    clube: string;
    clube_completo: string;
    escudo_url: string;
    posicao_ranking: number;
    categoria: string;
    temporada: number;
  };
  estatisticas: {
    total_gols: number;
    jogos_com_gol: number;
    jogos_totais_clube: number;
    frequencia_gols_pct: number;
    media_gols_jogo: number;
    gols_casa: number;
    gols_fora: number;
    pct_gols_casa: number;
    pct_gols_fora: number;
    dobletes: number;
    hat_tricks: number;
    gols_isolados: number;
    gols_chave_ouro: number;
    gols_chave_prata: number;
    gols_chave_bronze: number;
  };
  maiores_vitimas: MaiorVitimaAtleta[];
  historico_jogos: GolJogoAtleta[];
}

export interface DashboardCategoriaResumo {
  categoria: string;
  total_clubes: number;
  total_jogos: number;
  lider: {
    clube: string;
    escudo_url: string;
    pontos: number;
    jogos: number;
    vitorias: number;
    saldo_gols: number;
  } | null;
  artilheiro: {
    nome: string;
    foto_url: string | null;
    clube: string;
    escudo_url: string;
    gols: number;
    id_jogador: number | null;
    id_fase: number | null;
  } | null;
}

export interface DashboardArtilheiroGeral {
  posicao?: number;
  nome: string;
  foto_url: string | null;
  clube: string;
  clube_completo?: string;
  escudo_url: string;
  gols: number;
  id_jogador?: number;
  id_fase?: number;
  categoria?: string;
}

export interface DashboardJogoDestaque {
  data: string;
  dia: string;
  mes: string;
  hora: string;
  rodada: string;
  ginasio: string;
  mandante: string;
  escudo_mandante: string;
  placar_mandante?: number | null;
  visitante: string;
  escudo_visitante: string;
  placar_visitante?: number | null;
  status: string;
  sumula_url?: string | null;
}

export interface DashboardMeuClube {
  clube: string;
  escudo_url: string;
  posicao: number;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  indice_tecnico: number;
  pontos_total: number;
  jogos_total: number;
  vitorias_total: number;
  empates_total: number;
  derrotas_total: number;
  saldo_gols_total: number;
  diferenca_lider: number;
  margem_rebaixamento: number;
  pontos_por_categoria: { [key: string]: number };
  proximo_jogo: {
    data: string;
    dia: string;
    mes: string;
    hora: string;
    rodada: string;
    ginasio: string;
    mando: 'Casa' | 'Fora';
    adversario: string;
    adversario_escudo: string;
    adversario_posicao: number | null;
    adversario_chave: 'OURO' | 'PRATA' | 'BRONZE';
    mandante: string;
    visitante: string;
  } | null;
  principais_ameacas: {
    nome: string;
    foto_url: string | null;
    gols: number;
    categoria: string;
    id_jogador?: number;
    id_fase?: number;
  }[];
}

export interface DashboardResumoResponse {
  temporada: number;
  atualizado_em?: string;
  kpis: {
    total_clubes: number;
    total_categorias: number;
    total_atletas: number;
    total_partidas: number;
    total_sumulas: number;
  };
  lider_geral: RankingEficienciaItem | null;
  g4_torneio_uniao: RankingEficienciaItem[];
  zona_rebaixamento: RankingEficienciaItem[];
  categorias: DashboardCategoriaResumo[];
  top_artilheiros_geral: DashboardArtilheiroGeral[];
  jogos_destaque: DashboardJogoDestaque[];
  meu_clube?: DashboardMeuClube | null;
}

export interface SyncStatusResponse {
  is_syncing: boolean;
  status: 'idle' | 'sincronizando' | 'sucesso' | 'erro';
  mensagem: string;
  ultimo_erro: string | null;
  ultimo_sync: string | null;
  proximo_sync_agendado: string | null;
  total_execucoes: number;
}

export interface PlayoffTime {
  posicao: number;
  chave: 'OURO' | 'PRATA' | 'BRONZE';
  clube: string;
  clube_completo?: string;
  escudo_url: string;
  indice_tecnico?: number;
  pontos_total?: number;
  pontos?: number;
  jogos_total?: number;
  jogos?: number;
  saldo_gols_total?: number;
  saldo_gols?: number;
  vitorias_total?: number;
  vitorias?: number;
}

export interface PlayoffConfronto {
  id: string;
  titulo: string;
  semifinal_id: string;
  time_mandante: PlayoffTime;
  time_visitante: PlayoffTime;
  vantagem?: string;
}

export interface PlayoffChave {
  nome: string;
  cor: string;
  times: PlayoffTime[];
  quartas: PlayoffConfronto[];
}

export interface ConfrontoRodadaFinal {
  id: string;
  mandante: string;
  mandante_escudo: string;
  mandante_posicao: number | null;
  mandante_pontos: number;
  mandante_chave: 'OURO' | 'PRATA' | 'BRONZE';
  visitante: string;
  visitante_escudo: string;
  visitante_posicao: number | null;
  visitante_pontos: number;
  visitante_chave: 'OURO' | 'PRATA' | 'BRONZE';
  data: string;
  dia?: string;
  mes?: string;
  hora: string;
  ginasio: string;
  rodada: string;
  status_geral: 'Agendado' | 'Encerrado';
  jogos_sub: {
    [categoria: string]: {
      status: string;
      placar_mandante: number | null;
      placar_visitante: number | null;
      sumula_url: string | null;
    };
  };
}

export interface PlayoffsResponse {
  temporada: number;
  atualizado_em?: string;
  torneio_uniao: {
    ranking: RankingEficienciaItem[];
    chaves: {
      ouro: PlayoffChave;
      prata: PlayoffChave;
      bronze: PlayoffChave;
    };
  };
  categorias: {
    [categoria: string]: {
      ranking: ClassificacaoItem[];
      chaves: {
        ouro: PlayoffChave;
        prata: PlayoffChave;
        bronze: PlayoffChave;
      };
    };
  };
  confrontos_rodada_final: ConfrontoRodadaFinal[];
}


