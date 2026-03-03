import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Target, Search, MoreVertical, Pencil, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/components/ui/Button';
import { useApiData } from '@/contexts/ApiDataContext';
import type { ProfileItem } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterPopover } from '@/components/ui/FilterPopover';

// Default rates (fallback)
const DEFAULT_RATES: Record<string, number> = {
  USD: 0.000063,
  EUR: 0.000058,
  SGD: 0.000085,
  JPY: 0.0093,
};

const CURRENCY_INFO: Record<string, { code: string; symbol: string; name: string }> = {
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
};

type CurrencyType = keyof typeof CURRENCY_INFO;

// API Base URL configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api';

// Fetch rates from Free Currency API
const fetchExchangeRates = async (): Promise<Record<string, number> | null> => {
  try {
    // Using free-to-use API (exchangerate-api.com alternative)
    const response = await fetch(`${API_BASE}/exchange-rates`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.warn('Failed to fetch latest exchange rates, using cached or default rates', error);
    return null;
  }
};

let ratesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const loadExchangeRates = async (): Promise<Record<string, number>> => {
  const now = Date.now();
  if (ratesCache && (now - ratesCache.timestamp) < 6 * 60 * 60 * 1000) {
    return ratesCache.rates;
  }
  const newRates = await fetchExchangeRates();
  if (newRates) {
    ratesCache = { rates: newRates, timestamp: now };
    return newRates;
  }
  return ratesCache?.rates || DEFAULT_RATES;
};

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  date: string;
  bank?: string;
  sourceOrCategory?: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  projectId?: string;
};

export default function Finance() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { transactions, profile, addTransaction, deleteTransaction, updateProfile } = useApiData();
  const selectedCurrency = (profile.currency || 'USD') as CurrencyType;
  const setSelectedCurrency = (cur: CurrencyType) => updateProfile({ currency: cur as ProfileItem['currency'] });
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    const loadRates = async () => {
      setRatesLoading(true);
      const rates = await loadExchangeRates();
      setExchangeRates(rates);
      if (ratesCache) setRatesLastUpdated(ratesCache.timestamp);
      setRatesLoading(false);
    };
    loadRates();
  }, []);
  
  // Modals
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  
  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'this_week' | 'this_month' | 'this_year'>('this_month');
  
  // Calculations
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transactions.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    
    return { income, expense, net: income - expense };
  }, [transactions]);
  
  const formatMoney = (amount: number) => {
    const currencyInfo = CURRENCY_INFO[selectedCurrency];
    const rate = exchangeRates[selectedCurrency] || DEFAULT_RATES[selectedCurrency] || 1;
    const convertedAmount = amount * rate;
    
    if (selectedCurrency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: selectedCurrency, 
        maximumFractionDigits: 0 
      }).format(convertedAmount);
    } else {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: selectedCurrency, 
        maximumFractionDigits: 2 
      }).format(convertedAmount);
    }
  };
  
  const getLastUpdatedText = () => {
    if (!ratesLastUpdated) return '';
    const now = Date.now();
    const diff = now - ratesLastUpdated;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours === 0) return t('finance.updatedJustNow') || 'Just now';
    if (hours === 1) return t('finance.updated1HourAgo') || '1 hour ago';
    return `${hours}h ago`;
  };
  
  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full pb-10">
        <div className="flex items-center justify-between">
          <PageHeader 
            title={t('finance.title')} 
            description={t('finance.description')} 
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 relative">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyType)}
                className="px-3 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-sm font-medium text-[var(--color-text-high)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
              >
                {Object.entries(CURRENCY_INFO).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.symbol} {value.code}
                  </option>
                ))}
              </select>
              {ratesLastUpdated && (
                <div className="absolute -bottom-6 left-0 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                  {getLastUpdatedText()}
                </div>
              )}
            </div>
            <Button onClick={() => setShowAddTransaction(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('finance.addTransaction')}
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 border-none shadow-sm relative overflow-hidden bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-accent-primary)]/5 rounded-bl-full -mr-4 -mt-4" />
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[var(--color-accent-primary)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('finance.netBalance')}</p>
                <p className="text-2xl font-bold text-[var(--color-text-high)]">{formatMoney(summary.net)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 border-none shadow-sm relative overflow-hidden bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-status-success)]/5 rounded-bl-full -mr-4 -mt-4" />
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-status-success)]/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-[var(--color-status-success)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('finance.income')}</p>
                <p className="text-2xl font-bold text-[var(--color-status-success)]">{formatMoney(summary.income)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 border-none shadow-sm relative overflow-hidden bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-secondary)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-status-danger)]/5 rounded-bl-full -mr-4 -mt-4" />
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-status-danger)]/10 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-[var(--color-status-danger)]" />
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('finance.totalExpense')}</p>
                <p className="text-2xl font-bold text-[var(--color-status-danger)]">{formatMoney(summary.expense)}</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Recent Transactions */}
        <Card className="flex-1 flex flex-col mt-4">
          <CardHeader className="pb-3 flex-row items-center justify-between border-b border-[var(--color-border-subtle)]">
            <CardTitle className="text-base font-semibold text-[var(--color-text-high)]">{t('finance.recentTransactions')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAllTransactions(true)}>{t('finance.viewAll')}</Button>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            {transactions.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center">
                <Wallet className="h-10 w-10 text-[var(--color-text-muted)] mb-3 opacity-50" />
                <p className="text-sm font-medium text-[var(--color-text-main)]">{t('finance.noTransactions')}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">{t('finance.noTransactionsDesc')}</p>
                <Button size="sm" onClick={() => setShowAddTransaction(true)}>{t('finance.addTransaction')}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        tx.type === 'income' ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]" : "bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)]"
                      )}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-[var(--color-text-high)] truncate">{tx.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{new Date(tx.date).toLocaleDateString()} • {tx.bank || t('common.cash')}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-semibold shrink-0",
                      tx.type === 'income' ? "text-[var(--color-status-success)]" : "text-[var(--color-text-high)]"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Modal */}
      <Modal 
        open={showAddTransaction} 
        onClose={() => setShowAddTransaction(false)} 
        title={t('finance.addTransaction')}
        maxWidth="max-w-md"
      >
        <AddTransactionForm 
          onAdd={async (transaction) => {
            await addTransaction(transaction);
            setShowAddTransaction(false);
          }}
          t={t}
        />
      </Modal>

      {/* View All Transactions Modal */}
      <Modal 
        open={showAllTransactions} 
        onClose={() => setShowAllTransactions(false)} 
        title={t('finance.allTransactions')}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--color-text-muted)]">{t('finance.noTransactions')}</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    tx.type === 'income' ? "bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]" : "bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)]"
                  )}>
                    {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--color-text-high)] truncate">{tx.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{new Date(tx.date).toLocaleDateString()} • {tx.bank || t('common.cash')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "font-semibold shrink-0",
                    tx.type === 'income' ? "text-[var(--color-status-success)]" : "text-[var(--color-text-high)]"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => deleteTransaction(tx.id)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-status-danger)]" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}

// Add Transaction Form Component
function AddTransactionForm({ 
  onAdd, 
  t 
}: { 
  onAdd: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  t: (key: string) => string;
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bank, setBank] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    await onAdd({
      type,
      title,
      amount: parseFloat(amount),
      date,
      bank: bank || undefined,
    });
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setBank('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-[var(--color-text-main)] block mb-2">{t('finance.type')}</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('income')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg font-medium transition-colors",
              type === 'income'
                ? "bg-[var(--color-status-success)] text-white"
                : "border border-[var(--color-border-strong)] text-[var(--color-text-high)]"
            )}
          >
            {t('finance.income')}
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg font-medium transition-colors",
              type === 'expense'
                ? "bg-[var(--color-status-danger)] text-white"
                : "border border-[var(--color-border-strong)] text-[var(--color-text-high)]"
            )}
          >
            {t('finance.expense')}
          </button>
        </div>
      </div>

      <Input
        label={t('finance.title')}
        placeholder={t('finance.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Input
        label={t('finance.amount')}
        type="number"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Input
        label={t('finance.date')}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Input
        label={t('finance.bank')}
        placeholder={t('finance.bankPlaceholder')}
        value={bank}
        onChange={(e) => setBank(e.target.value)}
      />

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">{t('finance.save')}</Button>
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setTitle('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setBank('');
          }}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
