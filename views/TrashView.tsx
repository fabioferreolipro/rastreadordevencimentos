import React from 'react';
import { Navbar } from '../components/Navbar';
import { Bill } from '../types';

interface TrashViewProps {
  bills: Bill[];
  onRestore: (billId: string) => void;
  onPermanentDelete: (billId: string) => void;
  onEmptyTrash: () => void;
  onNavigate: (view: any) => void;
  onLogout?: () => void;
  syncStatus?: { isSyncing: boolean; error: string | null };
}

export const TrashView: React.FC<TrashViewProps> = ({ 
  bills = [], 
  onRestore, 
  onPermanentDelete, 
  onEmptyTrash,
  onNavigate,
  onLogout,
  syncStatus
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const date = new Date(datePart.slice(0, 10) + 'T12:00:00');
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background-dark text-white font-display">
      <Navbar currentView="trash" onNavigate={onNavigate} onLogout={onLogout} syncStatus={syncStatus} />

      <main className="flex-1 overflow-auto p-4 md:p-20 w-full max-w-[1400px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-text-muted mb-2">
               <button onClick={() => onNavigate('dashboard')} className="hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
               </button>
               <span className="text-xs font-bold uppercase tracking-widest">Sistema de Segurança</span>
            </div>
            <h1 className="text-white text-4xl font-black tracking-tight">Lixeira de Registros</h1>
            <p className="text-text-muted">Recupere contas excluídas ou remova-as permanentemente do sistema.</p>
          </div>

          {(bills || []).length > 0 && (
            <button 
              onClick={onEmptyTrash}
              className="h-12 px-6 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">delete_forever</span>
              Esvaziar Lixeira
            </button>
          )}
        </div>

        {!(bills && bills.length > 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-surface-dark/20 rounded-3xl border border-dashed border-border-dark">
            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-text-muted">delete</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sua lixeira está vazia</h3>
            <p className="text-text-muted text-center max-w-sm">Os itens excluídos aparecerão aqui por tempo indeterminado até que você os remova permanentemente.</p>
          </div>
        ) : (
          <div className="bg-card-dark rounded-2xl border border-border-dark overflow-hidden shadow-2xl">
            <div className="p-4 bg-warning/5 border-b border-warning/10 flex items-center gap-3">
               <span className="material-symbols-outlined text-xl text-warning">warning</span>
               <p className="text-xs text-warning/80 font-medium">Itens na lixeira ainda impactam os cálculos de MRR e projeções se forem recorrentes e não liquidados.</p>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-dark/50 border-b border-border-dark">
                  {['Conta', 'Valor', 'Vencimento Original', 'Ações'].map(head => (
                    <th key={head} className={`px-6 py-5 text-text-muted text-[10px] font-black uppercase tracking-widest align-middle ${head === 'Valor' ? 'text-right' : head === 'Ações' ? 'text-center' : ''}`}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {bills.map((bill, index) => {
                  if (!bill) return null;
                  return (
                    <tr key={bill.id || index} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5 whitespace-nowrap align-middle">
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">{bill.name || 'Sem Nome'}</span>
                          <span className="text-text-muted text-xs">ID #{bill.id ? bill.id.toString().slice(0, 4) : '---'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap align-middle text-right">
                        <span className="text-white text-sm font-bold">
                          R$ {(bill.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap align-middle">
                        <span className="text-text-muted text-sm">
                          {formatDate(bill.dueDate)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => onRestore(bill.id)}
                            className="p-2.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                            title="Restaurar Registro"
                          >
                            <span className="material-symbols-outlined text-sm">restore</span>
                            Restaurar
                          </button>
                          <button 
                            onClick={() => onPermanentDelete(bill.id)}
                            className="p-2.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                            title="Excluir Permanentemente"
                          >
                            <span className="material-symbols-outlined text-sm">delete_forever</span>
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
