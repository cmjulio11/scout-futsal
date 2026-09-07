import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuarioService, scoutService } from '../services/api';
import type { Usuario, Perfil, ScoutClubeItem } from '../types';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Shield,
  Eye,
  EyeOff,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

type FormData = {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  clube: string;
  ativo: boolean;
};

const defaultForm: FormData = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'comissao_tecnica',
  clube: '',
  ativo: true,
};

export default function UserManagementPage() {
  const { usuario: eu } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clubes, setClubes] = useState<ScoutClubeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroClube, setFiltroClube] = useState('todos');
  const [filtroPerfil, setFiltroPerfil] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const carregar = async () => {
    try {
      const [listaUsuarios, respClubes] = await Promise.all([
        usuarioService.listar(),
        scoutService.obterClubes(2026),
      ]);
      setUsuarios(listaUsuarios);
      setClubes(respClubes.clubes || []);
    } catch {
      toast.error('Erro ao carregar usuários ou lista de clubes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirCriar = () => {
    setForm(defaultForm);
    setEditando(null);
    setShowForm(true);
  };

  const abrirEditar = (u: Usuario) => {
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      perfil: u.perfil,
      clube: u.clube || '',
      ativo: u.ativo,
    });
    setEditando(u);
    setShowForm(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.email) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editando && !form.senha) {
      toast.error('Senha é obrigatória para um novo usuário.');
      return;
    }
    if (form.senha && form.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      if (editando) {
        const payload: any = {
          nome: form.nome,
          email: form.email,
          perfil: form.perfil,
          clube: form.clube ? form.clube : null,
          ativo: form.ativo,
        };
        if (form.senha) payload.senha = form.senha;
        await usuarioService.atualizar(editando.id, payload);
        toast.success('Usuário comercial atualizado com sucesso!');
      } else {
        await usuarioService.criar({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
          clube: form.clube ? form.clube : null,
          ativo: form.ativo,
        });
        toast.success('Novo usuário criado com sucesso!');
      }
      setShowForm(false);
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const alternarStatusRapido = async (u: Usuario) => {
    if (u.id === eu?.id) {
      toast.error('Você não pode desativar seu próprio login de administrador.');
      return;
    }
    const novoStatus = !u.ativo;
    try {
      await usuarioService.atualizar(u.id, { ativo: novoStatus });
      toast.success(
        novoStatus
          ? `Acesso de ${u.nome} ativado com sucesso!`
          : `Acesso de ${u.nome} bloqueado (mensalidade/suspensão).`
      );
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao alterar status.');
    }
  };

  const deletar = async (u: Usuario) => {
    if (!confirm(`Excluir permanentemente o acesso de ${u.nome}? Esta ação é irreversível.`)) {
      return;
    }
    try {
      await usuarioService.deletar(u.id);
      toast.success('Usuário removido da plataforma.');
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao excluir usuário.');
    }
  };

  const getPerfilInfo = (perfil: string) => {
    if (perfil === 'administrador') {
      return { label: 'Administrador', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    }
    return { label: 'Comissão Técnica', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      (u.clube && u.clube.toLowerCase().includes(busca.toLowerCase()));

    const matchClube =
      filtroClube === 'todos'
        ? true
        : filtroClube === 'sem_clube'
        ? !u.clube
        : u.clube?.toLowerCase() === filtroClube.toLowerCase();

    const matchPerfil = filtroPerfil === 'todos' ? true : u.perfil === filtroPerfil;

    const matchStatus =
      filtroStatus === 'todos' ? true : filtroStatus === 'ativos' ? u.ativo : !u.ativo;

    return matchBusca && matchClube && matchPerfil && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                  Módulo Comercial • Fase 2
                </span>
                <span className="text-xs text-slate-400">• Multi-Clube & Gestão de Acessos</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 mt-1 tracking-tight">
                <Users className="w-6 h-6 text-blue-400" />
                Gestão de Usuários & Equipes
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Vincule logins a clubes oficiais, controle perfis de acesso e gerencie o status de mensalidades.
              </p>
            </div>

            <button
              onClick={abrirCriar}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-900/30 cursor-pointer active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário Comercial</span>
            </button>
          </div>

          {/* Barra de Filtros & Busca */}
          <div className="bg-slate-900/70 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou clube..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
              />
            </div>

            {/* Dropdowns de Filtro */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Clube */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filtroClube}
                  onChange={(e) => setFiltroClube(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="todos" className="bg-slate-900">Todos os Clubes</option>
                  <option value="sem_clube" className="bg-slate-900">Sem Clube (Acesso Global)</option>
                  {clubes.map((c) => (
                    <option key={c.nome} value={c.nome} className="bg-slate-900">
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Perfil */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filtroPerfil}
                  onChange={(e) => setFiltroPerfil(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="todos" className="bg-slate-900">Todos os Perfis</option>
                  <option value="comissao_tecnica" className="bg-slate-900">Comissão Técnica</option>
                  <option value="administrador" className="bg-slate-900">Administrador</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="todos" className="bg-slate-900">Status: Todos</option>
                  <option value="ativos" className="bg-slate-900">Apenas Ativos</option>
                  <option value="bloqueados" className="bg-slate-900">Apenas Bloqueados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Carregando usuários comerciais...</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                Nenhum usuário encontrado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5">Usuário</th>
                      <th className="px-5 py-3.5">Clube Vinculado</th>
                      <th className="px-5 py-3.5">Função / Perfil</th>
                      <th className="px-5 py-3.5 text-center">Status Comercial</th>
                      <th className="px-5 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usuariosFiltrados.map((u) => {
                      const perfilInfo = getPerfilInfo(u.perfil);
                      const escudo =
                        u.clube_escudo_url ||
                        clubes.find((c) => c.nome.toLowerCase() === u.clube?.toLowerCase())?.escudo_url;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Coluna 1: Nome e Email */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                                {u.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-bold text-xs sm:text-sm">{u.nome}</p>
                                <p className="text-slate-400 text-[11px]">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Clube */}
                          <td className="px-5 py-3.5">
                            {u.clube ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={escudo || '/fpfs_shield.png'}
                                  alt={u.clube}
                                  className="w-6 h-6 object-contain shrink-0 drop-shadow"
                                  onError={(e) => {
                                    e.currentTarget.src = '/fpfs_shield.png';
                                  }}
                                />
                                <span className="font-extrabold text-white text-xs uppercase tracking-tight">
                                  {u.clube}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Acesso Global (Neutro)
                              </span>
                            )}
                          </td>

                          {/* Coluna 3: Perfil */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${perfilInfo.badge}`}
                            >
                              {u.perfil === 'administrador' ? <Shield className="w-3 h-3" /> : null}
                              {perfilInfo.label}
                            </span>
                          </td>

                          {/* Coluna 4: Status com Toggle Rápido de Mensalidade */}
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => alternarStatusRapido(u)}
                              disabled={u.id === eu?.id}
                              title={
                                u.id === eu?.id
                                  ? 'Você não pode desativar sua própria conta de administrador'
                                  : 'Clique para alternar status (Ativar / Bloquear)'
                              }
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                u.ativo
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25 ring-2 ring-rose-500/20 animate-pulse'
                              } ${u.id === eu?.id ? 'cursor-not-allowed opacity-80' : 'active:scale-95'}`}
                            >
                              {u.ativo ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Ativo</span>
                                </>
                              ) : (
                                <>
                                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Bloqueado</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Coluna 5: Ações */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => abrirEditar(u)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                                title="Editar dados cadastrais e clube"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {u.id !== eu?.id && (
                                <button
                                  onClick={() => deletar(u)}
                                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modal de Formulário (Criar / Editar) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full shrink-0" />
                <h3 className="text-white font-extrabold text-base sm:text-lg">
                  {editando ? 'Editar Usuário Comercial' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Treinador Marcos Silva"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1">
                  E-mail de Acesso
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                  placeholder="exemplo@clube.com.br"
                />
              </div>

              {/* Clube Vinculado */}
              <div>
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Clube Vinculado</span>
                  <span className="text-[10px] text-blue-400 lowercase font-normal">
                    (define a camisa que o usuário veste)
                  </span>
                </label>
                <select
                  value={form.clube}
                  onChange={(e) => setForm({ ...form, clube: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Acesso Geral (Sem Clube / Administração Global)</option>
                  {clubes.map((c) => (
                    <option key={c.nome} value={c.nome}>
                      {c.nome} {c.nome_completo && c.nome_completo !== c.nome ? `(${c.nome_completo})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Perfil / Função */}
              <div>
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1">
                  Função / Perfil de Acesso
                </label>
                <select
                  value={form.perfil}
                  onChange={(e) => setForm({ ...form, perfil: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="comissao_tecnica">Comissão Técnica (Treinador, Coordenador e Analista — Acesso Total ao Clube)</option>
                  <option value="administrador">Administrador Geral (Acesso Master e Gestão Comercial)</option>
                </select>
              </div>

              {/* Senha */}
              <div>
                <label className="text-slate-300 text-xs font-bold uppercase tracking-wider block mb-1">
                  Senha {editando && <span className="text-slate-500 normal-case">(deixe em branco para manter a atual)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 pr-10 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                    placeholder={editando ? '••••••••' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status Comercial (Ativo / Bloqueado) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-bold">Status do Acesso</p>
                  <p className="text-[11px] text-slate-400">
                    {form.ativo
                      ? 'Conta ativa e liberada para uso'
                      : 'Conta bloqueada (impede login por mensalidade pendente)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, ativo: !form.ativo })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    form.ativo ? 'bg-emerald-600' : 'bg-rose-900/80 border border-rose-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      form.ativo ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-900/40 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{editando ? 'Salvar Alterações' : 'Criar Usuário'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
