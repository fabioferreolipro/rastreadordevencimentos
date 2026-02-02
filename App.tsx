import React, { useState, useEffect } from 'react';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { CalendarView } from './views/CalendarView';
import { ReportsView } from './views/ReportsView';
import { TrashView } from './views/TrashView';
import { AddBillModal } from './components/AddBillModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { ViewState, Bill, Category } from './types';
import { MOCK_BILLS, DEFAULT_CATEGORIES } from './constants';
import { FinanceService } from './financeService';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('app_current_view');
    // If we have a hash, it takes priority over localStorage
    const hash = window.location.hash.replace('#', '') as ViewState;
    const validViews: ViewState[] = ['login', 'dashboard', 'calendar', 'reports', 'trash'];
    if (validViews.includes(hash)) return hash;
    return (saved as ViewState) || 'login';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('app_is_authenticated') === 'true';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('app_bills');
    return saved ? JSON.parse(saved) : MOCK_BILLS;
  });

  const [deletedBills, setDeletedBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('app_deleted_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('app_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [editingBill, setEditingBill] = useState<Bill | undefined>(undefined);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('app_current_view', currentView);
    if (window.location.hash.replace('#', '') !== currentView) {
      window.location.hash = currentView;
    }
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('app_is_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('app_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('app_deleted_bills', JSON.stringify(deletedBills));
  }, [deletedBills]);

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  }, [categories]);

  // Hash routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewState;
      const validViews: ViewState[] = ['login', 'dashboard', 'calendar', 'reports', 'trash'];
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && currentView !== 'login') {
      setCurrentView('login');
    } else if (isAuthenticated && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('login');
  };

  const handleAddBill = () => {
    setEditingBill(undefined);
    setIsModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleSaveBill = (billData: Partial<Bill>) => {
    if (editingBill) {
      // Update existing bill
      setBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, ...billData } as Bill : b));
    } else {
      // Add new bill
      const newBill: Bill = {
        ...billData,
        id: Math.random().toString(36).substr(2, 9),
        userId: 'current-user', // Mock user
      } as Bill;
      setBills(prev => [...prev, newBill]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteBill = (billId: string) => {
    if (confirm('Tem certeza que deseja mover esta conta para a lixeira?')) {
      const billToDelete = bills.find(b => b.id === billId);
      if (billToDelete) {
        setBills(prev => prev.filter(b => b.id !== billId));
        setDeletedBills(prev => [...prev, billToDelete]);
      }
    }
  };

  const handleRestoreBill = (billId: string) => {
    const billToRestore = deletedBills.find(b => b.id === billId);
    if (billToRestore) {
      setDeletedBills(prev => prev.filter(b => b.id !== billId));
      setBills(prev => [...prev, billToRestore]);
    }
  };

  const handlePermanentDelete = (billId: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta conta? Esta ação não pode ser desfeita.')) {
      setDeletedBills(prev => prev.filter(b => b.id !== billId));
    }
  };

  const handleAddCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const handleEditCategory = (category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? As contas vinculadas ficarão sem categoria.')) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setBills(prev => prev.map(b => b.category === categoryId ? { ...b, category: 'outros' } : b));
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Tem certeza que deseja esvaziar a lixeira? Todos os registros serão perdidos permanentemente.')) {
      setDeletedBills([]);
    }
  };

  const handleTogglePayBill = (billId: string) => {
    setBills(prev => {
      const bill = prev.find(b => b.id === billId);
      if (!bill) return prev;

      const isUnpaying = bill.status === 'paid' || bill.status === 'early' || bill.status === 'on_time' || bill.status === 'paid_partial';

      if (isUnpaying) {
        // Revert to unpaid state
        return prev.map(b => 
          b.id === billId 
            ? { 
                ...b, 
                status: FinanceService.determineStatus({ ...b, paymentDate: undefined }), 
                paymentDate: undefined,
                paidAmount: undefined,
                receiptId: undefined,
                exactPaymentTimestamp: undefined
              } as Bill 
            : b
        );
      } else {
        // Mark as paid
        const paymentDate = new Date().toISOString();
        const updatedBills = prev.map(b => 
          b.id === billId 
            ? { 
                ...b, 
                status: 'paid', 
                paymentDate,
                delayDays: FinanceService.calculateDaysDifference(b.dueDate, paymentDate)
              } as Bill 
            : b
        );

        // Lógica de recorrência
        if (bill.isRecurring && bill.frequency) {
          const nextDueDate = FinanceService.calculateNextDueDate(bill.dueDate, bill.frequency);
          const alreadyExists = prev.some(b => b.name === bill.name && b.dueDate === nextDueDate);
          
          if (!alreadyExists) {
            const nextBill: Bill = {
              ...bill,
              id: Math.random().toString(36).substr(2, 9),
              dueDate: nextDueDate,
              status: 'pending',
              paymentDate: undefined,
              paidAmount: undefined,
              receiptId: undefined,
              exactPaymentTimestamp: undefined,
              delayDays: 0,
            };
            return [...updatedBills, nextBill];
          }
        }
        return updatedBills;
      }
    });
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  // Safe fallback if view is invalid
  const isValidView = ['login', 'dashboard', 'calendar', 'reports', 'trash'].includes(currentView);

  // Error Boundary Simples (opcional, mas ajuda a debugar)
  if (!isValidView) {
    return <div className="p-20 text-white bg-danger">Erro: Vista inválida "{currentView}"</div>;
  }

  try {
    return (
      <>
        {currentView === 'login' && <LoginView onLogin={handleLogin} />}
        
        {currentView === 'dashboard' && (
          <DashboardView 
            bills={bills || []}
            categories={categories}
            onAddBill={handleAddBill} 
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
            onTogglePayBill={handleTogglePayBill}
            onNavigate={handleNavigate}
            onManageCategories={() => setIsCategoryModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
        
        {currentView === 'calendar' && (
          <CalendarView 
            bills={bills || []}
            categories={categories}
            onAddBill={handleAddBill} 
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
            onTogglePayBill={handleTogglePayBill}
            onNavigate={handleNavigate}
            onManageCategories={() => setIsCategoryModalOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView 
            bills={bills || []}
            categories={categories}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'trash' && (
          <TrashView 
            bills={deletedBills || []}
            onRestore={handleRestoreBill}
            onPermanentDelete={handlePermanentDelete}
            onEmptyTrash={handleEmptyTrash}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        <AddBillModal 
          isOpen={isModalOpen} 
          initialData={editingBill}
          categories={categories}
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveBill}
          onManageCategories={() => setIsCategoryModalOpen(true)}
        />

        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          categories={categories}
          onClose={() => setIsCategoryModalOpen(false)}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </>
    );
  } catch (error) {
    console.error("Render error:", error);
    return <div className="p-20 text-white bg-danger">Ocorreu um erro crítico de renderização. Verifique o console.</div>;
  }
}
