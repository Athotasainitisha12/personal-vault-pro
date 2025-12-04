import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, FolderLock, Trash2, Upload, CreditCard, FileText, Image, Video, Download, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultItem {
  id: string;
  name: string;
  type: 'card' | 'document' | 'photo' | 'video' | 'other';
  url: string;
  thumbnail?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

const itemTypes = [
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Other', icon: FileText },
];

export default function Vault() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<VaultItem['type']>('document');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'vault'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as VaultItem[];
      setItems(itemsData.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !file) return;

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      
      await addDoc(collection(db, 'vault'), {
        userId: user.uid,
        name,
        type,
        url: result.secure_url,
        thumbnail: result.secure_url,
        metadata: {
          format: result.format,
          size: result.bytes.toString(),
          width: result.width?.toString() || '',
          height: result.height?.toString() || '',
        },
        createdAt: new Date(),
      });
      
      toast.success('Item uploaded successfully');
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to upload item');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('document');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vault', id));
      toast.success('Item deleted');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const getTypeIcon = (itemType: string) => {
    const found = itemTypes.find((t) => t.value === itemType);
    return found?.icon || FileText;
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Digital Vault</h1>
          <p className="text-muted-foreground">Securely store your important documents</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload to Vault</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Passport, Credit Card"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={type} onValueChange={(v: VaultItem['type']) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">File *</label>
                <div
                  className={cn(
                    "mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50",
                    file && "border-primary bg-primary/5"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  {file ? (
                    <p className="text-sm text-foreground font-medium">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-foreground">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">Images, videos, or PDFs</p>
                    </>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
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
            placeholder="Search vault..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {itemTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderLock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Vault is empty</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start by uploading your important documents
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            const isMedia = item.type === 'photo' || item.type === 'video';
            
            return (
              <Card key={item.id} variant="interactive" className="group overflow-hidden">
                {isMedia && item.thumbnail ? (
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <TypeIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.metadata?.size && formatFileSize(item.metadata.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="mt-4">
              {previewItem.type === 'video' ? (
                <video src={previewItem.url} controls className="w-full rounded-lg" />
              ) : (
                <img src={previewItem.url} alt={previewItem.name} className="w-full rounded-lg" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
