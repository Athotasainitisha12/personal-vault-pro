import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, StickyNote, Trash2, Pencil, X, Tag } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function Notes() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Note[];
      setNotes(notesData.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)));
    });

    return () => unsubscribe();
  }, [user]);

  const allTags = [...new Set(notes.flatMap((note) => note.tags))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'notes', editingId), {
          title,
          content,
          tags,
          updatedAt: new Date(),
        });
        toast.success('Note updated');
      } else {
        await addDoc(collection(db, 'notes'), {
          userId: user.uid,
          title,
          content,
          tags,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Note created');
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setEditingId(null);
  };

  const handleEdit = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags);
    setEditingId(note.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Note' : 'Create Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Update Note' : 'Save Note'}
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
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <StickyNote className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No notes yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first note to get started
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} variant="interactive" className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground line-clamp-1">{note.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(note)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(note.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {note.content || 'No content'}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {note.updatedAt?.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
