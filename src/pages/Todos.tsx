import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, CheckSquare, Folder, Calendar } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: string;
  dueDate?: string;
  order: number;
  createdAt: Date;
}

const categories = ['Personal', 'Work', 'Shopping', 'Health', 'Learning', 'Other'];

function SortableTodo({ todo, onToggle, onDelete }: { todo: Todo; onToggle: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg bg-card border border-border transition-all",
        isDragging && "shadow-lg opacity-90",
        todo.completed && "opacity-60"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="4" cy="8" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="8" r="1.5" />
          <circle cx="10" cy="12" r="1.5" />
        </svg>
      </div>
      <Checkbox checked={todo.completed} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm text-foreground", todo.completed && "line-through text-muted-foreground")}>
          {todo.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {todo.category}
          </span>
          {todo.dueDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(todo.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function Todos() {
  const { user } = useAuthStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'todos'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Todo[];
      setTodos(todosData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTodo.trim()) return;

    try {
      await addDoc(collection(db, 'todos'), {
        userId: user.uid,
        text: newTodo.trim(),
        completed: false,
        category: newCategory,
        dueDate: newDueDate || null,
        order: todos.length,
        createdAt: new Date(),
      });
      setNewTodo('');
      setNewDueDate('');
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'todos', id), { completed: !completed });
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const newOrder = arrayMove(todos, oldIndex, newIndex);

    setTodos(newOrder);

    // Update order in Firestore
    try {
      await Promise.all(
        newOrder.map((todo, index) => updateDoc(doc(db, 'todos', todo.id), { order: index }))
      );
    } catch (error) {
      toast.error('Failed to reorder tasks');
    }
  };

  const filteredTodos = todos.filter((todo) => {
    const matchesCategory = filterCategory === 'all' || todo.category === filterCategory;
    const matchesCompleted = showCompleted || !todo.completed;
    return matchesCategory && matchesCompleted;
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Tasks</h1>
        <p className="text-muted-foreground">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      {/* Add task form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1"
            />
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full sm:w-40"
            />
            <Button type="submit">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <Folder className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showCompleted ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          {showCompleted ? 'Hide completed' : 'Show completed'}
        </Button>
      </div>

      {/* Tasks list */}
      {filteredTodos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No tasks yet</h3>
          <p className="text-muted-foreground text-sm">
            Add your first task to get started
          </p>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <SortableTodo
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id, todo.completed)}
                  onDelete={() => deleteTodo(todo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
