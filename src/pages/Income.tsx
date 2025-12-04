import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, TrendingUp, Trash2, Upload, Loader2, Wallet, Image, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  proofUrl?: string;
  createdAt: Date;
}

const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'];
const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

export default function Income() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('Salary');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Transaction[];
      setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description || !amount) return;

    setUploading(true);
    try {
      let proofUrl = '';
      if (proofFile) {
        const result = await uploadToCloudinary(proofFile);
        proofUrl = result.secure_url;
      }

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        description,
        amount: parseFloat(amount),
        type,
        category,
        date,
        proofUrl,
        createdAt: new Date(),
      });

      toast.success(`${type === 'income' ? 'Income' : 'Expense'} added`);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add transaction');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setType('income');
    setCategory('Salary');
    setDate(new Date().toISOString().slice(0, 10));
    setProofFile(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaction deleted');
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter((t) => t.date.startsWith(filterMonth));

  const totalIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Chart data - last 6 months
  const getChartData = () => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }

    return months.map((month) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(month));
      const income = monthTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return {
        month: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
        income,
        expense,
        balance: income - expense,
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Income & Expenses</h1>
          <p className="text-muted-foreground">Track your cash flow</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Button type="button" variant={type === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => { setType('income'); setCategory('Salary'); }}>
                  <ArrowUpRight className="w-4 h-4" /> Income
                </Button>
                <Button type="button" variant={type === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => { setType('expense'); setCategory('Food'); }}>
                  <ArrowDownRight className="w-4 h-4" /> Expense
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description *</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Amount *</label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(type === 'income' ? incomeCategories : expenseCategories).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Proof (optional)</label>
                <div className={cn("mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50", proofFile && "border-primary bg-primary/5")} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">{proofFile ? proofFile.name : 'Upload proof'}</p>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Add Transaction'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-40" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{totalIncome.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{totalExpense.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn("bg-gradient-to-br", balance >= 0 ? "from-primary/5 to-primary/10 border-primary/20" : "from-destructive/5 to-destructive/10 border-destructive/20")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", balance >= 0 ? "bg-primary/20" : "bg-destructive/20")}>
                <Wallet className={cn("w-6 h-6", balance >= 0 ? "text-primary" : "text-destructive")} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{balance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {transactions.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle className="text-base">Cash Flow - Last 6 Months</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transactions list */}
      {filteredTransactions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No transactions yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start tracking your cash flow</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4" /> Add Transaction</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((txn) => (
            <Card key={txn.id} className="group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", txn.type === 'income' ? "bg-green-500/10" : "bg-destructive/10")}>
                  {txn.type === 'income' ? <ArrowUpRight className="w-5 h-5 text-green-600" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{txn.description}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{txn.category}</span>
                    <span>•</span>
                    <span>{new Date(txn.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className={cn("font-semibold", txn.type === 'income' ? "text-green-600" : "text-destructive")}>
                  {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {txn.proofUrl && (
                    <Button variant="ghost" size="icon-sm" onClick={() => window.open(txn.proofUrl, '_blank')}>
                      <Image className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(txn.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
