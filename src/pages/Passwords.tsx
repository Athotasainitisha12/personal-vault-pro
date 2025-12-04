import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, Search, Key, Globe, Folder, Pencil } from 'lucide-react';

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  category: string;
  createdAt: Date;
}

const categories = ['Social Media', 'Email', 'Banking', 'Shopping', 'Work', 'Entertainment', 'Other'];

function generatePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

export default function Passwords() {
  const { user } = useAuthStore();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('Other');

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'passwords'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const passwordsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Password[];
      setPasswords(passwordsData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !password) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'passwords', editingId), {
          title,
          username,
          password,
          website,
          category,
        });
        toast.success('Password updated');
      } else {
        await addDoc(collection(db, 'passwords'), {
          userId: user.uid,
          title,
          username,
          password,
          website,
          category,
          createdAt: new Date(),
        });
        toast.success('Password saved');
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save password');
    }
  };

  const resetForm = () => {
    setTitle('');
    setUsername('');
    setPassword('');
    setWebsite('');
    setCategory('Other');
    setEditingId(null);
  };

  const handleEdit = (pw: Password) => {
    setTitle(pw.title);
    setUsername(pw.username);
    setPassword(pw.password);
    setWebsite(pw.website || '');
    setCategory(pw.category);
    setEditingId(pw.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'passwords', id));
      toast.success('Password deleted');
    } catch (error) {
      toast.error('Failed to delete password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredPasswords = passwords.filter((pw) => {
    const matchesSearch = pw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pw.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || pw.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Passwords</h1>
          <p className="text-muted-foreground">Securely manage all your credentials</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Add Password
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Password' : 'Add New Password'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Gmail, Netflix"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Username / Email</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Password *</label>
                <div className="flex gap-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPassword(generatePassword())}
                    title="Generate password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Website</label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Update Password' : 'Save Password'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passwords..."
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Folder className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Password list */}
      {filteredPasswords.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No passwords yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first password to get started
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Password
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredPasswords.map((pw) => (
            <Card key={pw.id} variant="interactive" className="group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{pw.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {pw.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{pw.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                      {visiblePasswords.has(pw.id) ? pw.password : '••••••••••••'}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => togglePasswordVisibility(pw.id)}
                  >
                    {visiblePasswords.has(pw.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyToClipboard(pw.password)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {pw.website && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => window.open(pw.website, '_blank')}
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(pw)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(pw.id)}
                    className="text-destructive hover:text-destructive"
                  >
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
