import { Bill, Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'moradia', name: 'Moradia', color: '#3b82f6' },
  { id: 'alimentacao', name: 'Alimentação', color: '#10b981' },
  { id: 'transporte', name: 'Transporte', color: '#f59e0b' },
  { id: 'saude', name: 'Saúde', color: '#ef4444' },
  { id: 'educacao', name: 'Educação', color: '#8b5cf6' },
  { id: 'lazer', name: 'Lazer', color: '#ec4899' },
  { id: 'servicos', name: 'Serviços', color: '#6b7280' },
  { id: 'outros', name: 'Outros', color: '#94a3b8' },
];

export const MOCK_BILLS: Bill[] = [
  {
    id: '1',
    name: 'Banco Nacional',
    amount: 1800.00,
    issueDate: '2026-01-25',
    dueDate: '2026-01-31',
    status: 'pending',
    isRecurring: true,
    frequency: 'monthly',
    category: 'moradia',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '2',
    name: 'Companhia de Energia',
    amount: 145.00,
    issueDate: '2026-01-10',
    dueDate: '2026-01-20',
    status: 'paid',
    isRecurring: true,
    frequency: 'monthly',
    category: 'servicos',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '3',
    name: 'Cartão Gold',
    amount: 450.00,
    issueDate: '2026-01-01',
    dueDate: '2026-01-12',
    status: 'overdue',
    isRecurring: false,
    category: 'outros',
    notes: '...9012',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '4',
    name: 'Internet Fibra',
    amount: 120.00,
    issueDate: '2026-01-10',
    dueDate: '2026-01-25',
    status: 'paid',
    isRecurring: true,
    frequency: 'monthly',
    category: 'servicos',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '5',
    name: 'Academia Smart',
    amount: 99.90,
    issueDate: '2026-01-15',
    dueDate: '2026-02-05',
    status: 'pending',
    isRecurring: true,
    frequency: 'monthly',
    category: 'saude',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '6',
    name: 'Seguro Carro',
    amount: 250.00,
    issueDate: '2026-01-05',
    dueDate: '2026-01-20',
    status: 'paid',
    isRecurring: true,
    frequency: 'monthly',
    category: 'transporte',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '7',
    name: 'Supermercado',
    amount: 600.00,
    issueDate: '2026-01-10',
    dueDate: '2026-01-15',
    status: 'paid',
    isRecurring: false,
    category: 'alimentacao',
    delayDays: 0,
    userId: 'mock-user'
  },
  {
    id: '8',
    name: 'Netflix',
    amount: 55.90,
    issueDate: '2026-01-01',
    dueDate: '2026-01-05',
    status: 'paid',
    isRecurring: true,
    frequency: 'monthly',
    category: 'lazer',
    delayDays: 0,
    userId: 'mock-user'
  }
];

export const USER_AVATAR_URL = "";
