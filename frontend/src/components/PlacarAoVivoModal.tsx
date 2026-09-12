import { useState, useEffect } from 'react';
import { X, Flame, CheckCircle2, Clock } from 'lucide-react';
import type { JogoItem } from '../types';

interface PlacarAoVivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  jogo: JogoItem | null;
  onSalvar: (placarM: number, placarV: number, status: string) => Promise<void>;
}

export default function PlacarAoVivoModal({
  isOpen,
  onClose,
  jogo,
  onSalvar,
}: PlacarAoVivoModalProps) {
  const [placarM, setPlacarM] = useState<number>(0);
  const [placarV, setPlacarV] = useState<number>(0);
  const [status, setStatus] = useState<string>('Em Andamento');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (jogo) {
      setPlacarM(jogo.placar_mandante ?? 0);
      setPlacarV(jogo.placar_visitante ?? 0);
      setStatus(jogo.status === 'Encerrado' ? 'Encerrado' : 'Em Andamento');
    }
  }, [jogo, isOpen]);

  if (!isOpen || !jogo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await onSalvar(placarM, placarV, status);
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Placar Ao Vivo • Central Técnica</h2>
              <p className="text-[11px] text-slate-400">{jogo.rodada || 'Partida'} • {jogo.ginasio}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Seletor de Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Status da Partida:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Em Andamento')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  status === 'Em Andamento'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Ao Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Encerrado')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  status === 'Encerrado'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encerrado</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Agendado')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  status === 'Agendado'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Agendado</span>
              </button>
            </div>
          </div>

          {/* Confronto e Controles de Placar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-4 sm:gap-6 items-center">
              {/* Mandante */}
              <div className="flex flex-col items-center text-center space-y-3">
                <img
                  src={jogo.escudo_mandante}
                  alt={jogo.mandante}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/fpfs_shield.png';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-black text-white text-xs sm:text-sm uppercase truncate max-w-[130px]">
                    {jogo.mandante}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Mandante</span>
                </div>
                {/* Contador de Gols Mandante */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlacarM((p) => Math.max(0, p - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active:scale-95 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl sm:text-3xl font-black text-white w-10 text-center">
                    {placarM}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlacarM((p) => p + 1)}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/50 text-white font-black text-sm flex items-center justify-center active:scale-95 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Visitante */}
              <div className="flex flex-col items-center text-center space-y-3 border-l border-slate-800/80 pl-4 sm:pl-6">
                <img
                  src={jogo.escudo_visitante}
                  alt={jogo.visitante}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/fpfs_shield.png';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-black text-white text-xs sm:text-sm uppercase truncate max-w-[130px]">
                    {jogo.visitante}
                  </p>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Visitante</span>
                </div>
                {/* Contador de Gols Visitante */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPlacarV((p) => Math.max(0, p - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center active:scale-95 transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl sm:text-3xl font-black text-white w-10 text-center">
                    {placarV}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPlacarV((p) => p + 1)}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/50 text-white font-black text-sm flex items-center justify-center active:scale-95 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-500 border border-amber-400/40 shadow-lg shadow-amber-950/40 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {salvando ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Salvar Placar em Tempo Real</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
