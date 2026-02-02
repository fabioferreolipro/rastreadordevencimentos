import React from 'react';
import { USER_AVATAR_URL } from '../constants';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onLogout }) => {
  // Verificação de segurança para a URL do avatar
  const avatarStyle = USER_AVATAR_URL 
    ? { backgroundImage: `url("${USER_AVATAR_URL}")` } 
    : { backgroundColor: '#242a47' };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark bg-card-dark px-6 md:px-20 py-3 sticky top-0 z-50 w-full shadow-lg">
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-3 text-white cursor-pointer group"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-tight">Rastreador de Vencimentos</h2>
        </div>
        <nav className="hidden md:flex items-center gap-9">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className={`${currentView === 'dashboard' ? 'text-white font-bold' : 'text-text-muted'} text-sm hover:text-primary transition-colors`}
          >
            Início
          </button>
          <button 
            onClick={() => onNavigate('calendar')} 
            className={`${currentView === 'calendar' ? 'text-white font-bold' : 'text-text-muted'} text-sm hover:text-primary transition-colors`}
          >
            Calendário
          </button>
          <button 
            onClick={() => onNavigate('reports')} 
            className={`${currentView === 'reports' ? 'text-white font-bold' : 'text-text-muted'} text-sm hover:text-primary transition-colors`}
          >
            Relatórios
          </button>
          <button 
            onClick={() => onNavigate('trash')} 
            className={`${currentView === 'trash' ? 'text-white font-bold' : 'text-text-muted'} text-sm hover:text-primary transition-colors flex items-center gap-1.5`}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Lixeira
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center min-w-40 h-10 max-w-64 relative">
           <span className="material-symbols-outlined absolute left-3 text-text-muted text-lg">search</span>
           <input 
             className="w-full h-full bg-surface-dark rounded-lg border border-border-dark pl-10 pr-4 text-white placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
             placeholder="Buscar..."
           />
        </div>
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary/20 shrink-0 border border-white/10" 
          style={avatarStyle}
        >
          {!USER_AVATAR_URL && <span className="material-symbols-outlined text-text-muted flex items-center justify-center h-full">person</span>}
        </div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-2 text-text-muted hover:text-danger transition-colors flex items-center gap-1"
            title="Sair"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
