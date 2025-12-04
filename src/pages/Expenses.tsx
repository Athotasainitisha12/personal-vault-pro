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
import { Plus, Wallet, Trash2, Upload, CreditCard, Loader2, TrendingDown, Calendar, Image } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  date: string;
  proofUrl?: string;
  createdAt: Date;
}

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const sources = ['Credit Card', 'Debit Card', 'Cash', 'UPI', 'Loan', 'Borrowed'];
const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#6b7280'];

export default function Expenses() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterSource, setFilterSource] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [source, setSource] = useState('Credit Card');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Expense[];
      setExpenses(expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

      await addDoc(collection(db, 'expenses'), {
        userId: user.uid,
        description,
        amount: parseFloat(amount),
        category,
        source,
        date,
        proofUrl,
        createdAt: new Date(),
      });

      toast.success('Expense added');
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('Other');
    setSource('Credit Card');
    setDate(new Date().toISOString().slice(0, 10));
    setProofFile(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success('Expense deleted');
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesMonth = exp.date.startsWith(filterMonth);
    const matchesSource = filterSource === 'all' || exp.source === filterSource;
    return matchesMonth && matchesSource;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryData = categories.map((cat) => ({
    name: cat,
    value: filteredExpenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter((d) => d.value > 0);

  const sourceData = sources.map((src) => ({
    name: src,
    value: filteredExpenses.filter((e) => e.source === src).reduce((sum, e) => sum + e.amount, 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Expenses</h1>
          <p className="text-muted-foreground">Track your spending</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Description *</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you spend on?" required />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Source</label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Proof (optional)</label>
                <div className={cn("mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50", proofFile && "border-primary bg-primary/5")} onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">{proofFile ? proofFile.name : 'Upload receipt'}</p>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Add Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-40" />
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{totalExpenses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Transactions</p>
            <p className="text-2xl font-bold text-foreground">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Avg per transaction</p>
            <p className="text-2xl font-bold text-foreground">₹{filteredExpenses.length ? (totalExpenses / filteredExpenses.length).toFixed(0) : 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {filteredExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">By Source</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses list */}
      {filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No expenses yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Start tracking your spending</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4" /> Add Expense</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <Card key={exp.id} className="group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{exp.description}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{exp.category}</span>
                    <span>•</span>
                    <span>{exp.source}</span>
                    <span>•</span>
                    <span>{new Date(exp.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="font-semibold text-destructive">-₹{exp.amount.toLocaleString()}</p>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {exp.proofUrl && (
                    <Button variant="ghost" size="icon-sm" onClick={() => window.open(exp.proofUrl, '_blank')}>
                      <Image className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(exp.id)} className="text-destructive hover:text-destructive">
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
