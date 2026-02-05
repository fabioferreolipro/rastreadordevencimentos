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
import { PocketBaseCollections, PocketBaseService } from './pocketbaseService';

export const resolveInitialView = (hashValue: string, savedValue: string | null): ViewState => {
  const saved = savedValue as ViewState | null;
  const hash = hashValue.replace('#', '') as ViewState;
  const validViews: ViewState[] = ['login', 'dashboard', 'calendar', 'reports', 'trash'];
  if (validViews.includes(hash)) return hash;
  if (saved && validViews.includes(saved)) return saved;
  return 'login';
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem('app_current_view');
    return resolveInitialView(window.location.hash, saved);
  });

  const [authToken, setAuthToken] = useState<string>(() => {
    return PocketBaseService.getAuthState()?.token || '';
  });

  const [authUserId, setAuthUserId] = useState<string>(() => {
    return PocketBaseService.getAuthState()?.record?.id || '';
  });

  const isAuthenticated = Boolean(authToken);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  useEffect(() => {
    const existing = PocketBaseService.getAuthState();
    if (!existing?.token) return;
    PocketBaseService.authRefresh(existing.token)
      .then((refreshed) => {
        setAuthToken(refreshed.token);
        setAuthUserId(refreshed.record.id);
      })
      .catch(() => {
        PocketBaseService.clearAuthState();
        setAuthToken('');
        setAuthUserId('');
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const cacheRead = <T,>(key: string): { ts: number; data: T } | null => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as { ts: number; data: T };
      } catch {
        return null;
      }
    };

    const cacheWrite = (key: string, data: unknown) => {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    };

    const CATEGORIES_CACHE_KEY = 'pb_cache_categories_v1';
    const BILLS_CACHE_KEY = 'pb_cache_bills_v1';
    const TTL_MS = 60_000;

    const cachedCategories = cacheRead<Category[]>(CATEGORIES_CACHE_KEY);
    if (cachedCategories?.data?.length && Date.now() - cachedCategories.ts < TTL_MS) {
      setCategories(cachedCategories.data);
    }

    const cachedBills = cacheRead<Bill[]>(BILLS_CACHE_KEY);
    if (cachedBills?.data?.length && Date.now() - cachedBills.ts < TTL_MS) {
      setBills(cachedBills.data);
    }

    setIsSyncing(true);
    setSyncError(null);

    Promise.all([
      PocketBaseService.listRecords<Category>(authToken, PocketBaseCollections.categories, {
        page: 1,
        perPage: 200,
        sort: '-created',
        fields: 'id,name,color,icon,userId'
      }),
      PocketBaseService.listRecords<Bill>(authToken, PocketBaseCollections.bills, {
        page: 1,
        perPage: 500,
        sort: '-created',
        filter: 'isTrashed = false',
        fields: 'id,name,amount,paidAmount,issueDate,dueDate,paymentDate,paymentMethod,exactPaymentTimestamp,delayDays,status,isRecurring,frequency,category,notes,userId,receiptId,isTrashed,trashedAt'
      }),
      PocketBaseService.listRecords<Bill>(authToken, PocketBaseCollections.bills, {
        page: 1,
        perPage: 500,
        sort: '-created',
        filter: 'isTrashed = true',
        fields: 'id,name,amount,paidAmount,issueDate,dueDate,paymentDate,paymentMethod,exactPaymentTimestamp,delayDays,status,isRecurring,frequency,category,notes,userId,receiptId,isTrashed,trashedAt'
      })
    ])
      .then(([cats, billsResp, trashedResp]) => {
        setCategories(cats.items as Category[]);
        setBills(billsResp.items as Bill[]);
        setDeletedBills(trashedResp.items as Bill[]);
        cacheWrite(CATEGORIES_CACHE_KEY, cats.items);
        cacheWrite(BILLS_CACHE_KEY, billsResp.items);
      })
      .catch((err: any) => {
        setSyncError(err?.message || 'Falha ao sincronizar com o PocketBase.');
      })
      .finally(() => setIsSyncing(false));
  }, [isAuthenticated, authToken]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && currentView !== 'login') {
      setCurrentView('login');
    } else if (isAuthenticated && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = async (identity: string, password: string) => {
    const auth = await PocketBaseService.authWithPassword(identity, password);
    setAuthToken(auth.token);
    setAuthUserId(auth.record.id);
    setCurrentView('dashboard');
  };

  const handleRegister = async (email: string, password: string, passwordConfirm: string) => {
    await PocketBaseService.createUser(email, password, passwordConfirm);
  };

  const handleForgotPassword = async (email: string) => {
    await PocketBaseService.requestPasswordReset(email);
  };

  const handleLogout = () => {
    PocketBaseService.clearAuthState();
    setAuthToken('');
    setAuthUserId('');
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
      const prevBills = bills;
      setBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, ...billData } as Bill : b));

      if (isAuthenticated && authToken) {
        PocketBaseService.updateRecord(authToken, PocketBaseCollections.bills, editingBill.id, {
          ...billData,
          userId: authUserId
        }).catch(() => {
          setBills(prevBills);
        });
      }
    } else {
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      const newBill: Bill = {
        ...billData,
        id: tempId,
        userId: authUserId || 'current-user',
      } as Bill;
      setBills(prev => [...prev, newBill]);

      if (isAuthenticated && authToken) {
        PocketBaseService.createRecord<Bill>(authToken, PocketBaseCollections.bills, {
          ...billData,
          isTrashed: false,
          userId: authUserId
        })
          .then((created) => {
            setBills(prev => prev.map(b => b.id === tempId ? (created as any as Bill) : b));
          })
          .catch(() => {
            setBills(prev => prev.filter(b => b.id !== tempId));
          });
      }
    }
    setIsModalOpen(false);
  };

  const handleDeleteBill = (billId: string) => {
    if (confirm('Tem certeza que deseja mover esta conta para a lixeira?')) {
      const billToDelete = bills.find(b => b.id === billId);
      if (billToDelete) {
        setBills(prev => prev.filter(b => b.id !== billId));
        setDeletedBills(prev => [...prev, billToDelete]);

        if (isAuthenticated && authToken && !billId.startsWith('tmp-')) {
          PocketBaseService.updateRecord(authToken, PocketBaseCollections.bills, billId, {
            isTrashed: true,
            trashedAt: new Date().toISOString()
          }).catch(() => {
            setBills(prev => [...prev, billToDelete]);
            setDeletedBills(prev => prev.filter(b => b.id !== billId));
          });
        }
      }
    }
  };

  const handleRestoreBill = (billId: string) => {
    const billToRestore = deletedBills.find(b => b.id === billId);
    if (billToRestore) {
      setDeletedBills(prev => prev.filter(b => b.id !== billId));
      setBills(prev => [...prev, billToRestore]);

      if (isAuthenticated && authToken && !billId.startsWith('tmp-')) {
        PocketBaseService.updateRecord(authToken, PocketBaseCollections.bills, billId, {
          isTrashed: false,
          trashedAt: ''
        }).catch(() => {
          setBills(prev => prev.filter(b => b.id !== billId));
          setDeletedBills(prev => [...prev, billToRestore]);
        });
      }
    }
  };

  const handlePermanentDelete = (billId: string) => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta conta? Esta ação não pode ser desfeita.')) {
      const billToDelete = deletedBills.find(b => b.id === billId);
      setDeletedBills(prev => prev.filter(b => b.id !== billId));

      if (isAuthenticated && authToken && billToDelete && !billId.startsWith('tmp-')) {
        PocketBaseService.deleteRecord(authToken, PocketBaseCollections.bills, billId).catch(() => {
          setDeletedBills(prev => [...prev, billToDelete]);
        });
      }
    }
  };

  const handleAddCategory = (category: Category) => {
    const tempId = category.id.startsWith('tmp-') ? category.id : `tmp-${category.id}`;
    const optimistic: Category = { ...category, id: tempId };
    setCategories(prev => [...prev, optimistic]);

    if (isAuthenticated && authToken) {
      PocketBaseService.createRecord<Category>(authToken, PocketBaseCollections.categories, {
        name: category.name,
        color: category.color,
        icon: (category as any).icon,
        userId: authUserId
      })
        .then((created) => {
          setCategories(prev => prev.map(c => c.id === tempId ? (created as any as Category) : c));
        })
        .catch(() => {
          setCategories(prev => prev.filter(c => c.id !== tempId));
        });
    }
  };

  const handleEditCategory = (category: Category) => {
    const prev = categories;
    setCategories(prevState => prevState.map(c => c.id === category.id ? category : c));

    if (isAuthenticated && authToken && !category.id.startsWith('tmp-')) {
      PocketBaseService.updateRecord<Category>(authToken, PocketBaseCollections.categories, category.id, {
        name: category.name,
        color: category.color,
        icon: (category as any).icon
      }).catch(() => {
        setCategories(prev);
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? As contas vinculadas ficarão sem categoria.')) {
      const prevCategories = categories;
      const prevBills = bills;
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      setBills(prev => prev.map(b => b.category === categoryId ? { ...b, category: undefined } as Bill : b));

      if (isAuthenticated && authToken && !categoryId.startsWith('tmp-')) {
        (async () => {
          try {
            const affected = prevBills.filter(b => b.category === categoryId && !b.id.startsWith('tmp-'));
            for (const bill of affected) {
              await PocketBaseService.updateRecord(authToken, PocketBaseCollections.bills, bill.id, { category: '' });
            }
            await PocketBaseService.deleteRecord(authToken, PocketBaseCollections.categories, categoryId);
          } catch {
            setCategories(prevCategories);
            setBills(prevBills);
          }
        })();
      }
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Tem certeza que deseja esvaziar a lixeira? Todos os registros serão perdidos permanentemente.')) {
      const prev = deletedBills;
      setDeletedBills([]);

      if (isAuthenticated && authToken) {
        (async () => {
          for (const bill of prev) {
            if (bill.id.startsWith('tmp-')) continue;
            try {
              await PocketBaseService.deleteRecord(authToken, PocketBaseCollections.bills, bill.id);
            } catch {
              setDeletedBills(current => current.some(b => b.id === bill.id) ? current : [...current, bill]);
            }
          }
        })();
      }
    }
  };

  const handleTogglePayBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const isUnpaying = bill.status === 'paid' || bill.status === 'early' || bill.status === 'on_time' || bill.status === 'paid_partial';

    let updatedBill: Bill;
    let nextBill: Bill | null = null;

    if (isUnpaying) {
      updatedBill = {
        ...bill,
        status: FinanceService.determineStatus({ ...bill, paymentDate: undefined }),
        paymentDate: undefined,
        paidAmount: undefined,
        receiptId: undefined,
        exactPaymentTimestamp: undefined
      } as Bill;
    } else {
      const paymentDate = new Date().toISOString();
      updatedBill = {
        ...bill,
        status: 'paid',
        paymentDate,
        delayDays: FinanceService.calculateDaysDifference(bill.dueDate, paymentDate)
      } as Bill;

      if (bill.isRecurring && bill.frequency) {
        const nextDueDate = FinanceService.calculateNextDueDate(bill.dueDate, bill.frequency);
        const alreadyExists = bills.some(b => b.name === bill.name && b.dueDate === nextDueDate && b.userId === bill.userId);
        if (!alreadyExists) {
          nextBill = {
            ...bill,
            id: `tmp-${Math.random().toString(36).slice(2)}`,
            dueDate: nextDueDate,
            status: 'pending',
            paymentDate: undefined,
            paidAmount: undefined,
            receiptId: undefined,
            exactPaymentTimestamp: undefined,
            delayDays: 0,
          } as Bill;
        }
      }
    }

    const prevBills = bills;
    setBills(prev => {
      const base = prev.map(b => b.id === billId ? updatedBill : b);
      return nextBill ? [...base, nextBill] : base;
    });

    if (isAuthenticated && authToken && !billId.startsWith('tmp-')) {
      PocketBaseService.updateRecord(authToken, PocketBaseCollections.bills, billId, {
        status: updatedBill.status,
        paymentDate: updatedBill.paymentDate,
        paidAmount: updatedBill.paidAmount,
        receiptId: updatedBill.receiptId,
        exactPaymentTimestamp: updatedBill.exactPaymentTimestamp,
        delayDays: updatedBill.delayDays
      }).catch(() => {
        setBills(prevBills);
      });
    }

    if (nextBill && isAuthenticated && authToken) {
      PocketBaseService.createRecord<Bill>(authToken, PocketBaseCollections.bills, {
        ...nextBill,
        id: undefined,
        isTrashed: false,
        userId: authUserId
      })
        .then((created) => {
          setBills(prev => prev.map(b => b.id === nextBill!.id ? (created as any as Bill) : b));
        })
        .catch(() => {
          setBills(prev => prev.filter(b => b.id !== nextBill!.id));
        });
    }
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
        {currentView === 'login' && (
          <LoginView 
            onLogin={handleLogin} 
            onRegister={handleRegister}
            onForgotPassword={handleForgotPassword}
          />
        )}
        
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
            syncStatus={{ isSyncing, error: syncError }}
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
            syncStatus={{ isSyncing, error: syncError }}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView 
            bills={bills || []}
            categories={categories}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            syncStatus={{ isSyncing, error: syncError }}
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
            syncStatus={{ isSyncing, error: syncError }}
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
