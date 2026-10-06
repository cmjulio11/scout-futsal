import asyncio
import threading
from datetime import datetime, timedelta, time
from typing import Optional, Dict, Any
from . import scraper_fpfs


class SyncManager:
    """
    Gerenciador central de sincronizacao de dados da Federacao Paulista de Futsal.
    Garante exclusao mutua (Mutex Lock) para evitar multiplas execucoes simultaneas,
    condicoes de corrida, bloqueio de IP ou corrupcao de banco.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SyncManager, cls).__new__(cls)
                    cls._instance._inicializado = False
        return cls._instance

    def __init__(self):
        if getattr(self, '_inicializado', False):
            return
        self.is_syncing: bool = False
        self.last_sync_at: Optional[datetime] = None
        self.last_status: str = "idle"
        self.last_message: str = "Aguardando primeira sincronizacao."
        self.last_error: Optional[str] = None
        self.total_execucoes: int = 0
        self.proxima_execucao_agendada: Optional[datetime] = None
        self._task_cron: Optional[asyncio.Task] = None
        self._inicializado = True
        self._calcular_proxima_execucao()

    def _calcular_proxima_execucao(self) -> datetime:
        """
        Calcula o proximo horario agendado de sincronizacao:
        Executa a cada 3 horas ao longo do dia (06h, 09h, 12h, 15h, 18h, 21h, 23h)
        para garantir que novos jogos e resultados do mata-mata sejam capturados rapidamente.
        """
        agora = datetime.now()
        hoje = agora.date()
        candidatos = []

        horarios = [6, 9, 12, 15, 18, 21, 23]
        for h in horarios:
            t = datetime.combine(hoje, time(h, 0, 0))
            if t > agora:
                candidatos.append(t)

        amanha = hoje + timedelta(days=1)
        for h in horarios:
            candidatos.append(datetime.combine(amanha, time(h, 0, 0)))

        candidatos.sort()
        self.proxima_execucao_agendada = candidatos[0]
        return self.proxima_execucao_agendada

    def sincronizar_com_trava(self, temporada: int = 2026, disparado_por: str = "manual") -> Dict[str, Any]:
        """
        Executa a sincronizacao oficial garantindo que NENHUM outro processo
        concorrente rode ao mesmo tempo.
        """
        with self._lock:
            if self.is_syncing:
                return {
                    "status": "em_andamento",
                    "sucesso": False,
                    "mensagem": "Uma sincronizacao oficial com a Federacao Paulista ja esta em andamento. Os dados estarao atualizados em instantes.",
                    "em_andamento": True,
                    "sincronizado_em": self.last_sync_at.isoformat() if self.last_sync_at else None,
                }
            self.is_syncing = True
            self.last_status = "sincronizando"
            self.last_message = f"Sincronizacao em andamento (disparada via {disparado_por})..."

        inicio = datetime.now()
        print(f"[SYNC-MANAGER] Inicio de sincronizacao ({disparado_por.upper()}) da temporada {temporada} as {inicio.strftime('%H:%M:%S')}...")

        try:
            resultado = scraper_fpfs.sincronizar_temporada(temporada)
            duracao = (datetime.now() - inicio).total_seconds()

            with self._lock:
                self.last_sync_at = datetime.now()
                self.last_status = "sucesso"
                self.last_message = f"Sincronizacao concluida com sucesso em {duracao:.1f}s ({disparado_por})."
                self.last_error = None
                self.total_execucoes += 1
                self._calcular_proxima_execucao()

            print(f"[SYNC-MANAGER] Sincronizacao da temporada {temporada} concluida em {duracao:.1f}s!")
            return {
                "status": "sucesso",
                "sucesso": True,
                "temporada": temporada,
                "mensagem": self.last_message,
                "sincronizado_em": self.last_sync_at.isoformat(),
                "duracao_segundos": round(duracao, 1),
                "proxima_agendada": self.proxima_execucao_agendada.isoformat() if self.proxima_execucao_agendada else None,
            }
        except Exception as e:
            with self._lock:
                self.last_status = "erro"
                self.last_error = str(e)
                self.last_message = f"Falha na sincronizacao: {str(e)}"
                self._calcular_proxima_execucao()

            print(f"[SYNC-MANAGER] Erro ao sincronizar temporada {temporada}: {e}")
            return {
                "status": "erro",
                "sucesso": False,
                "temporada": temporada,
                "mensagem": self.last_message,
                "erro": str(e),
                "sincronizado_em": self.last_sync_at.isoformat() if self.last_sync_at else None,
            }
        finally:
            with self._lock:
                self.is_syncing = False

    def obter_status(self) -> Dict[str, Any]:
        """Retorna o estado atual da sincronizacao para exibicao no frontend."""
        self._calcular_proxima_execucao()
        ultimo_sync_str = self.last_sync_at.isoformat() if self.last_sync_at else None
        if not ultimo_sync_str:
            try:
                dados = scraper_fpfs.obter_dados_completos(2026)
                ultimo_sync_str = dados.get("atualizado_em")
            except Exception:
                pass

        return {
            "is_syncing": self.is_syncing,
            "status": self.last_status,
            "mensagem": self.last_message,
            "ultimo_erro": self.last_error,
            "ultimo_sync": ultimo_sync_str,
            "proximo_sync_agendado": self.proxima_execucao_agendada.isoformat() if self.proxima_execucao_agendada else None,
            "total_execucoes": self.total_execucoes,
        }

    async def iniciar_loop_cron(self, temporada: int = 2026):
        """
        Rotina em background que verifica periodicamente e dispara
        a sincronizacao automatica nos horarios agendados.
        """
        print(f"[CRON] Robo de Sincronizacao Agendada iniciado. Proxima execucao: {self.proxima_execucao_agendada.strftime('%d/%m/%Y %H:%M:%S')}")

        # 1. Checagem inteligente no boot: se o banco local estiver há mais de 2 horas sem sync, sincroniza em background
        try:
            dados = scraper_fpfs.carregar_dados_locais(temporada)
            precisa_sync = True
            if dados and dados.get("atualizado_em"):
                try:
                    ult_sync = datetime.fromisoformat(dados["atualizado_em"])
                    # Se tiver menos de 2 horas desde o último sync, não precisa sincronizar imediatamente
                    if (datetime.utcnow() - ult_sync).total_seconds() < 7200:
                        precisa_sync = False
                except Exception:
                    pass
            if precisa_sync:
                print("[CRON] Base local desatualizada no boot. Disparando sync automatico em background...")
                await asyncio.to_thread(self.sincronizar_com_trava, temporada, "startup_auto")
        except Exception as e:
            print(f"[CRON] Aviso na checagem inicial de sync: {e}")

        # 2. Loop de agendamento periódico
        while True:
            try:
                agora = datetime.now()
                if self.proxima_execucao_agendada and agora >= self.proxima_execucao_agendada:
                    print(f"[CRON] Horario programado atingido ({agora.strftime('%H:%M:%S')}). Disparando sincronizacao automatica...")
                    await asyncio.to_thread(self.sincronizar_com_trava, temporada, "cron_automatico")
                    self._calcular_proxima_execucao()
                    print(f"[CRON] Proxima execucao reprogramada para: {self.proxima_execucao_agendada.strftime('%d/%m/%Y %H:%M:%S')}")

                await asyncio.sleep(30)
            except asyncio.CancelledError:
                print("[CRON] Robo de sincronizacao finalizado.")
                break
            except Exception as e:
                print(f"[CRON] Erro no loop de agendamento: {e}")
                await asyncio.sleep(60)


sync_manager = SyncManager()
