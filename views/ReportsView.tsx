import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Bill, Category } from '../types';
import { AnalyticsService } from '../analyticsService';
import { ReportExportService } from '../reportExportService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Download, FileSpreadsheet, FileText, FileCode, Filter, 
  TrendingUp, Calendar, Tag, PieChart as PieIcon, BarChart3,
  ChevronDown, ChevronUp, Maximize2, RefreshCw
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

interface ReportsViewProps {
  bills: Bill[];
  categories: Category[];
  onNavigate: (view: any) => void;
  onLogout?: () => void;
  syncStatus?: { isSyncing: boolean; error: string | null };
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  bills = [], 
  categories = [], 
  onNavigate,
  onLogout,
  syncStatus
}) => {
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const safeBills = Array.isArray(bills) ? bills : [];

  const filteredBills = useMemo(() => {
    return safeBills.filter(bill => {
      const matchType = filterType === 'all' || (filterType === 'recurring' ? bill.isRecurring : !bill.isRecurring);
      const matchStatus = filterStatus === 'all' || (filterStatus === 'paid' ? (bill.status === 'paid' || bill.status === 'early' || bill.status === 'on_time') : bill.status === filterStatus);
      const matchCategory = filterCategory === 'all' || bill.category === filterCategory;
      return matchType && matchStatus && matchCategory;
    });
  }, [safeBills, filterType, filterStatus, filterCategory]);

  const summary = useMemo(() => {
    const rawSummary = AnalyticsService.generateFinancialSummary(filteredBills);
    
    // Map category IDs to Names for display in charts
    const mappedCategoryDistribution = rawSummary.categoryDistribution.map(dist => {
      const cat = categories.find(c => c.id === dist.category);
      return {
        ...dist,
        categoryName: cat?.name || 'Outros',
        color: cat?.color || '#94a3b8'
      };
    });

    return {
      ...rawSummary,
      categoryDistribution: mappedCategoryDistribution
    };
  }, [filteredBills, categories]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const date = new Date(datePart.slice(0, 10) + 'T12:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    if (format === 'pdf') ReportExportService.exportToPDF(filteredBills, categories);
    if (format === 'excel') ReportExportService.exportToExcel(filteredBills, categories);
    if (format === 'csv') ReportExportService.exportToCSV(filteredBills, categories);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background-dark text-white font-display overflow-hidden">
       <Navbar currentView="reports" onNavigate={onNavigate} onLogout={onLogout} syncStatus={syncStatus} />

      <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-12 w-full max-w-[1600px] mx-auto flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-white text-4xl font-black tracking-tight">Relatórios Inteligentes</h1>
            <p className="text-text-muted">Visão completa e analítica da sua saúde financeira.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 bg-primary px-6 py-3 rounded-2xl font-black text-sm hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
              >
                <Download className="size-4" />
                EXPORTAR DADOS
                <ChevronDown className={`size-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-surface-dark border border-border-dark rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors border-b border-border-dark">
                    <FileText className="size-4 text-red-400" /> PDF Document
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors border-b border-border-dark">
                    <FileSpreadsheet className="size-4 text-green-400" /> Excel Sheet
                  </button>
                  <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors">
                    <FileCode className="size-4 text-blue-400" /> CSV Data
                  </button>
                </div>
              )}
            </div>
            <button className="p-3 bg-surface-dark border border-border-dark rounded-2xl hover:bg-white/5 transition-colors">
              <RefreshCw className="size-5 text-text-muted" />
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="glass-panel p-6 rounded-3xl border border-border-dark bg-surface-dark/40 flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Tipo de Conta</label>
            <div className="flex bg-background-dark/50 p-1 rounded-xl border border-border-dark">
              {(['all', 'recurring', 'one-time'] as const).map((type) => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filterType === type ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                >
                  {type === 'all' ? 'Tudo' : type === 'recurring' ? 'Recorrente' : 'Único'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</label>
            <div className="flex bg-background-dark/50 p-1 rounded-xl border border-border-dark">
              {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filterStatus === status ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                >
                  {status === 'all' ? 'Tudo' : status === 'paid' ? 'Pago' : status === 'pending' ? 'Pendente' : 'Atrasado'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[180px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Categoria</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-background-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Receita Mensal (MRR)" 
            value={summary.mrr} 
            icon={<TrendingUp className="size-6 text-primary" />} 
            color="primary"
            description="Base recorrente mensal"
          />
          <MetricCard 
            title="Total Pendente" 
            value={summary.totalPending} 
            icon={<Calendar className="size-6 text-yellow-400" />} 
            color="yellow"
            description="A receber este período"
          />
          <MetricCard 
            title="Total em Atraso" 
            value={summary.totalOverdue} 
            icon={<Tag className="size-6 text-red-400" />} 
            color="red"
            description="Pagamentos expirados"
          />
          <MetricCard 
            title="Projeção Anual" 
            value={summary.annualProjection} 
            icon={<BarChart3 className="size-6 text-green-400" />} 
            color="green"
            description="Estimativa próximos 12 meses"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trend Analysis Chart */}
          <div className="glass-panel p-8 rounded-3xl border border-border-dark bg-surface-dark/20 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3">
                <TrendingUp className="size-5 text-primary" /> Tendências de Receita
              </h3>
              <button className="p-2 hover:bg-white/5 rounded-xl transition-colors"><Maximize2 className="size-4 text-text-muted" /></button>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.trends}>
                  <defs>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121214', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="paid" stroke="#00E676" fillOpacity={1} fill="url(#colorPaid)" strokeWidth={3} name="Pago" />
                  <Area type="monotone" dataKey="pending" stroke="#0088FE" fillOpacity={1} fill="url(#colorPending)" strokeWidth={3} name="Pendente" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-panel p-8 rounded-3xl border border-border-dark bg-surface-dark/20 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-3">
                <PieIcon className="size-5 text-primary" /> Distribuição por Categoria
              </h3>
              <button className="p-2 hover:bg-white/5 rounded-xl transition-colors"><Maximize2 className="size-4 text-text-muted" /></button>
            </div>
            <div className="h-[350px] w-full flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="amount"
                      nameKey="categoryName"
                    >
                      {summary.categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#121214', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 min-w-[150px]">
                {summary.categoryDistribution.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-2 text-xs">
                    <div className="size-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-text-muted capitalize">{entry.categoryName}</span>
                    <span className="font-bold ml-auto">R$ {entry.amount.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table Section */}
        <div className="bg-card-dark rounded-3xl border border-border-dark overflow-hidden shadow-2xl mb-12">
          <div className="p-8 border-b border-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-black">Detalhamento de Fluxo</h3>
              <p className="text-text-muted text-sm">Listagem analítica baseada nos filtros aplicados.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-dark/50 text-text-muted text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Vencimento</th>
                  <th className="px-8 py-5">Nome da Conta</th>
                  <th className="px-8 py-5">Categoria</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {filteredBills.length > 0 ? filteredBills.map((bill, index) => (
                  <tr key={bill.id || index} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5 text-sm text-text-muted">{formatDate(bill.dueDate)}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{bill.name}</span>
                        <span className="text-[10px] text-text-muted">{bill.isRecurring ? 'Conta Recorrente' : 'Pagamento Único'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {(() => {
                        const cat = categories.find(c => c.id === bill.category);
                        return (
                          <span 
                            className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter"
                            style={{ backgroundColor: `${cat?.color || '#64748b'}20`, color: cat?.color || '#64748b', border: `1px solid ${cat?.color || '#64748b'}40` }}
                          >
                            {cat?.name || 'Outros'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${
                          bill.status === 'paid' || bill.status === 'early' || bill.status === 'on_time' ? 'bg-success shadow-[0_0_8px_rgba(0,230,118,0.5)]' : 
                          bill.status === 'overdue' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                        }`}></div>
                        <span className="text-xs font-bold capitalize">{bill.status.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-right text-white">R$ {(bill.amount || 0).toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-4">
                        <Filter className="size-12 opacity-10" />
                        <p>Nenhum registro encontrado para os filtros selecionados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'primary' | 'yellow' | 'red' | 'green';
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color, description }) => {
  const colorMap = {
    primary: 'border-primary/20 bg-primary/5',
    yellow: 'border-yellow-500/20 bg-yellow-500/5',
    red: 'border-red-500/20 bg-red-500/5',
    green: 'border-green-500/20 bg-green-500/5'
  };

  return (
    <div className={`glass-panel p-6 rounded-3xl border ${colorMap[color]} relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-surface-dark/50 rounded-2xl border border-border-dark group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
        </div>
        <div className="flex flex-col">
          <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">{title}</p>
          <h2 className="text-3xl font-black text-white">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className="text-text-muted text-[10px] mt-1">{description}</p>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
        {icon}
      </div>
    </div>
  );
};
