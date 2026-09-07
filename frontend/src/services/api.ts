import axios from 'axios';
import type {
  LoginRequest,
  TokenResponse,
  Usuario,
  ClassificacaoItem,
  RankingEficienciaItem,
  JogoItem,
  ArtilheiroItem,
  ScoutClubeItem,
  PartidaRodadaItem,
  ConfrontoScoutResponse,
  FichaAtletaResponse,
  DashboardResumoResponse,
  SyncStatusResponse,
  PlayoffsResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adiciona token JWT a todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redireciona ao login se 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (dados: LoginRequest) =>
    api.post<TokenResponse>('/api/auth/login', dados).then((r) => r.data),
};

export const usuarioService = {
  listar: () => api.get<Usuario[]>('/api/usuarios/').then((r) => r.data),
  criar: (dados: Omit<Usuario, 'id' | 'criado_em'> & { senha: string }) =>
    api.post<Usuario>('/api/usuarios/', dados).then((r) => r.data),
  atualizar: (id: string, dados: Partial<Usuario> & { senha?: string }) =>
    api.put<Usuario>(`/api/usuarios/${id}`, dados).then((r) => r.data),
  deletar: (id: string) => api.delete(`/api/usuarios/${id}`),
  meuPerfil: () => api.get<Usuario>('/api/usuarios/me').then((r) => r.data),
};

export const campeonatosService = {
  obterTemporadas: () =>
    api.get<number[]>('/api/campeonatos/temporadas').then((r) => r.data),
  obterCategorias: () =>
    api.get<{ id: string; nome: string }[]>('/api/campeonatos/categorias').then((r) => r.data),
  obterTabela: (temporada: number, categoria: string) =>
    api
      .get<{
        temporada: number;
        categoria: string;
        atualizado_em: string;
        total_equipes: number;
        classificacao: ClassificacaoItem[];
      }>('/api/campeonatos/tabela', { params: { temporada, categoria } })
      .then((r) => r.data),
  obterRankingEficiencia: (temporada: number) =>
    api
      .get<{
        temporada: number;
        titulo: string;
        atualizado_em: string;
        total_clubes: number;
        ranking: RankingEficienciaItem[];
      }>('/api/campeonatos/ranking-eficiencia', { params: { temporada } })
      .then((r) => r.data),
  obterJogos: (temporada: number, categoria: string) =>
    api
      .get<{
        temporada: number;
        categoria: string;
        atualizado_em: string;
        total_jogos: number;
        jogos: JogoItem[];
      }>('/api/campeonatos/jogos', { params: { temporada, categoria } })
      .then((r) => r.data),
  obterArtilharia: (temporada: number, categoria: string) =>
    api
      .get<{
        temporada: number;
        categoria: string;
        total_atletas: number;
        artilharia: ArtilheiroItem[];
      }>('/api/campeonatos/artilharia', { params: { temporada, categoria } })
      .then((r) => r.data),
  obterFichaAtleta: (
    temporada: number = 2026,
    categoria: string = 'Sub-7',
    id_jogador?: number,
    id_fase?: number,
    nome?: string
  ) =>
    api
      .get<FichaAtletaResponse>('/api/campeonatos/atleta', {
        params: {
          temporada,
          categoria,
          ...(id_jogador ? { id_jogador } : {}),
          ...(id_fase ? { id_fase } : {}),
          ...(nome ? { nome } : {}),
        },
      })
      .then((r) => r.data),
  baixarPdfAtleta: async (
    temporada: number = 2026,
    categoria: string = 'Sub-7',
    id_jogador?: number,
    id_fase?: number,
    nome?: string
  ) => {
    const response = await api.get('/api/campeonatos/atleta/pdf', {
      params: {
        temporada,
        categoria,
        ...(id_jogador ? { id_jogador } : {}),
        ...(id_fase ? { id_fase } : {}),
        ...(nome ? { nome } : {}),
      },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nomeClean = (nome || 'Atleta').trim().replace(/\s+/g, '_');
    link.setAttribute('download', `Ficha_Tecnica_${nomeClean}_${categoria}_FPFS_${temporada}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  obterDashboardResumo: (temporada: number = 2026, clube?: string | null) =>
    api
      .get<DashboardResumoResponse>('/api/campeonatos/dashboard-resumo', {
        params: { temporada, ...(clube ? { clube } : {}) },
      })
      .then((r) => r.data),
  sincronizar: (temporada: number = 2026) =>
    api.post('/api/campeonatos/sincronizar', null, { params: { temporada } }).then((r) => r.data),
  obterSyncStatus: () =>
    api.get<SyncStatusResponse>('/api/campeonatos/sync-status').then((r) => r.data),
  obterPlayoffs: (temporada: number = 2026) =>
    api.get<PlayoffsResponse>('/api/campeonatos/playoffs', { params: { temporada } }).then((r) => r.data),
};

export const scoutService = {
  obterClubes: (temporada: number = 2026) =>
    api
      .get<{
        temporada: number;
        total: number;
        clubes: ScoutClubeItem[];
      }>('/api/scout/clubes', { params: { temporada } })
      .then((r) => r.data),

  obterPartidasRodada: (temporada: number = 2026, categoria: string = 'Sub-7') =>
    api
      .get<{
        temporada: number;
        categoria: string;
        total: number;
        partidas: PartidaRodadaItem[];
      }>('/api/scout/partidas-rodada', { params: { temporada, categoria } })
      .then((r) => r.data),

  obterConfronto: (
    mandante: string,
    visitante: string,
    temporada: number = 2026,
    categoria?: string | null
  ) =>
    api
      .get<ConfrontoScoutResponse>('/api/scout/confronto', {
        params: {
          temporada,
          mandante,
          visitante,
          ...(categoria ? { categoria } : {}),
        },
      })
      .then((r) => r.data),

  baixarPdfConfronto: async (
    mandante: string,
    visitante: string,
    temporada: number = 2026,
    categoria?: string | null,
    jogoInfo?: {
      data?: string;
      hora?: string;
      ginasio?: string;
      rodada?: string;
    }
  ) => {
    const params: Record<string, any> = {
      mandante,
      visitante,
      temporada,
    };
    if (categoria && categoria !== 'geral') {
      params.categoria = categoria;
    }
    if (jogoInfo?.data) params.data_jogo = jogoInfo.data;
    if (jogoInfo?.hora) params.hora_jogo = jogoInfo.hora;
    if (jogoInfo?.ginasio) params.ginasio_jogo = jogoInfo.ginasio;
    if (jogoInfo?.rodada) params.rodada_jogo = jogoInfo.rodada;

    const response = await api.get('/api/scout/confronto/pdf', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const mClean = mandante.trim().replace(/\s+/g, '_');
    const vClean = visitante.trim().replace(/\s+/g, '_');
    link.setAttribute('download', `Dossie_PreJogo_${mClean}_x_${vClean}_FPFS_${temporada}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default api;
