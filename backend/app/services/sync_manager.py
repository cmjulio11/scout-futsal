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
        - Diariamente as 06:00 da manha.
        - Finais de semana (sabado e domingo) tambem as 21:00 da noite.
        """
        agora = datetime.now()
        hoje = agora.date()

        candidatos = []

        # 1. Hoje as 06:00
        t_06 = datetime.combine(hoje, time(6, 0, 0))
        if t_06 > agora:
            candidatos.append(t_06)

        # 2. Hoje as 21:00 (se for sabado=5 ou domingo=6)
        if agora.weekday() in (5, 6):
            t_21 = datetime.combine(hoje, time(21, 0, 0))
            if t_21 > agora:
                candidatos.append(t_21)

        # 3. Amanha as 06:00
        amanha = hoje + timedelta(days=1)
        candidatos.append(datetime.combine(amanha, time(6, 0, 0)))

        # 4. Amanha as 21:00 (se amanha for sabado ou domingo)
        if amanha.weekday() in (5, 6):
            candidatos.append(datetime.combine(amanha, time(21, 0, 0)))

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
