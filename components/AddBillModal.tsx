import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, ReceiptText } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { FinanceService } from '../financeService';
import { Bill, PaymentMethod, Category } from '../types';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (bill: Partial<Bill>) => void;
  initialData?: Partial<Bill>;
  categories: Category[];
  onManageCategories: () => void;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  categories = [],
  onManageCategories
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [category, setCategory] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [notes, setNotes] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const issueDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const paymentDateRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLSelectElement>(null);
  const paidAmountRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    }
    const digits = value.replace(/\D/g, '');
    const num = parseFloat(digits) / 100;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const parseCurrencyToNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 0;
    return parseFloat(digits) / 100;
  };

  // Sync state with initialData when modal opens for editing
  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setAmount(initialData?.amount ? formatCurrency(initialData.amount) : '');
      setPaidAmount(initialData?.paidAmount ? formatCurrency(initialData.paidAmount) : '');
      setIssueDate(initialData?.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setDueDate(initialData?.dueDate?.split('T')[0] || '');
      setPaymentDate(initialData?.paymentDate?.split('T')[0] || '');
      setPaymentMethod(initialData?.paymentMethod || 'pix');
      setCategory(initialData?.category || '');
      setIsRecurring(initialData?.isRecurring ?? true);
      setFrequency(initialData?.frequency || 'monthly');
      setNotes(initialData?.notes || '');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (amount && (!paidAmount || paidAmount !== amount) && !paymentDate) {
      setPaidAmount(amount);
    }
  }, [amount, paymentDate]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        handleSave();
      }
    }
  };

  const handleSave = () => {
    const numAmount = parseCurrencyToNumber(amount);
    const numPaidAmount = paidAmount ? parseCurrencyToNumber(paidAmount) : undefined;

    if (!name || !numAmount || !issueDate || !dueDate) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    const billData: Partial<Bill> = {
      name,
      amount: numAmount,
      paidAmount: numPaidAmount,
      issueDate,
      dueDate,
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentDate ? paymentMethod : undefined,
      category: category || undefined,
      delayDays: paymentDate ? FinanceService.calculateDaysDifference(dueDate, paymentDate) : 0,
      exactPaymentTimestamp: paymentDate ? new Date().toISOString() : undefined,
      receiptId: paymentDate ? FinanceService.generateReceiptId() : undefined,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      notes,
      status: FinanceService.determineStatus({ 
        amount: numAmount, 
        paidAmount: numPaidAmount, 
        dueDate, 
        paymentDate
      })
    };

    if (onSave) onSave(billData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-[850px] bg-[#1a1e32] border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-8 border-b border-border-dark bg-[#1e233d] flex justify-between items-center">
          <div>
            <h2 className="text-white text-[28px] font-bold">{initialData?.id ? 'Gerenciar Conta' : 'Nova Operação Financeira'}</h2>
            <p className="text-text-muted text-sm">Controle de vencimentos e pagamentos.</p>
          </div>
          {paymentDate && (
             <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-xl text-success">
               <span className="material-symbols-outlined text-xl">check_circle</span>
               <span className="text-xs font-bold uppercase tracking-wider">Operação Liquidada</span>
             </div>
          )}
        </div>

        <div className="p-8 space-y-6 overflow-y-auto pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-white text-sm font-medium">Nome da Conta / Título *</span>
              <input 
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, amountRef)}
                className="h-14 bg-card-dark border border-border-dark rounded-xl px-5 text-white focus:border-primary transition-all"
                placeholder="Ex: Nota Fiscal 1234"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">Valor Nominal *</span>
                <input 
                  ref={amountRef}
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(formatCurrency(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e, categoryRef)}
                  className="h-14 bg-card-dark border border-border-dark rounded-xl px-5 text-white focus:border-primary transition-all"
                  placeholder="R$ 0,00"
                />
              </label>
              <label className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">Categoria</span>
                  <button 
                    type="button"
                    onClick={onManageCategories}
                    className="text-primary text-[10px] font-bold uppercase tracking-wider hover:underline"
                  >
                    Gerenciar
                  </button>
                </div>
                <select 
                  ref={categoryRef}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, issueDateRef)}
                  className="h-14 bg-card-dark border border-border-dark rounded-xl px-4 text-white focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Outros</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DatePicker 
              inputRef={issueDateRef}
              label="Emissão *" 
              value={issueDate} 
              onChange={setIssueDate} 
              onEnter={() => dueDateRef.current?.focus()} 
            />
            <DatePicker 
              inputRef={dueDateRef}
              label="Vencimento *" 
              value={dueDate} 
              onChange={setDueDate} 
              onEnter={() => paymentDateRef.current?.focus()} 
            />
            <DatePicker 
              inputRef={paymentDateRef}
              label="Pagamento Realizado" 
              value={paymentDate} 
              onChange={setPaymentDate} 
              onEnter={() => {
                if (paymentMethodRef.current) {
                  paymentMethodRef.current.focus();
                } else {
                  handleSave();
                }
              }} 
            />
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-xl flex items-center justify-center transition-colors ${isRecurring ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
                <span className="material-symbols-outlined">repeat</span>
              </div>
              <div>
                <h4 className="text-white font-bold">Conta Recorrente</h4>
                <p className="text-text-muted text-xs">Ative para gerar parcelas automáticas.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isRecurring ? 'bg-primary' : 'bg-border-dark'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>

              {isRecurring && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                  <span className="text-text-muted text-xs font-bold uppercase">Ciclo:</span>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    onKeyDown={handleKeyDown}
                    className="bg-card-dark border border-border-dark rounded-lg px-3 py-2 text-white text-sm focus:border-primary cursor-pointer outline-none"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {paymentDate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">Método de Pagamento</span>
                <select 
                  ref={paymentMethodRef}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  onKeyDown={(e) => handleKeyDown(e, paidAmountRef)}
                  className="h-14 bg-card-dark border border-border-dark rounded-xl px-4 text-white focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência / TED</option>
                  <option value="dinheiro">Espécie / Dinheiro</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">Valor Liquidado (Final)</span>
                <input 
                  ref={paidAmountRef}
                  type="text"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(formatCurrency(e.target.value))}
                  onKeyDown={(e) => handleKeyDown(e)}
                  className="h-14 bg-card-dark border border-success/30 rounded-xl px-5 text-success font-black text-lg focus:border-success transition-all"
                  placeholder="R$ 0,00"
                />
              </label>
            </div>
          )}

          <div className="pt-6 flex gap-4">
            <button onClick={handleSave} className="flex-1 h-14 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xl">check_circle</span>
              {initialData?.id ? 'Confirmar Alterações' : 'Registrar Operação'}
            </button>
            {paymentDate && (
               <button className="px-6 h-14 bg-surface-dark border border-border-dark text-text-muted hover:text-white rounded-xl transition-all flex items-center gap-2">
                 <span className="material-symbols-outlined text-xl">receipt_long</span>
                 Comprovante
               </button>
            )}
            <button onClick={onClose} className="size-14 flex items-center justify-center bg-border-dark/50 text-text-muted hover:text-white rounded-xl border border-border-dark transition-all">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
