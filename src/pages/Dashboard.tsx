import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Key, StickyNote, CheckSquare, FolderLock, Wallet, TrendingUp, ArrowRight, Shield, Clock, Sparkles } from 'lucide-react';

const features = [
  {
    title: 'Passwords',
    description: 'Securely manage all your credentials',
    icon: Key,
    path: '/passwords',
    color: 'bg-blue-500/10 text-blue-600',
    count: null,
  },
  {
    title: 'Notes',
    description: 'Quick notes and important thoughts',
    icon: StickyNote,
    path: '/notes',
    color: 'bg-amber-500/10 text-amber-600',
    count: null,
  },
  {
    title: 'Tasks',
    description: 'Stay organized with your todos',
    icon: CheckSquare,
    path: '/todos',
    color: 'bg-green-500/10 text-green-600',
    count: null,
  },
  {
    title: 'Digital Vault',
    description: 'Store sensitive documents safely',
    icon: FolderLock,
    path: '/vault',
    color: 'bg-purple-500/10 text-purple-600',
    count: null,
  },
  {
    title: 'Expenses',
    description: 'Track your spending habits',
    icon: Wallet,
    path: '/expenses',
    color: 'bg-red-500/10 text-red-600',
    count: null,
  },
  {
    title: 'Income',
    description: 'Monitor your earnings',
    icon: TrendingUp,
    path: '/income',
    color: 'bg-teal-500/10 text-teal-600',
    count: null,
  },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const firstName = user?.email?.split('@')[0] || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Welcome to your personal manager. Everything you need, in one place.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Secure</p>
              <p className="text-sm text-muted-foreground">All data encrypted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Always On</p>
              <p className="text-sm text-muted-foreground">Access anywhere</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Smart</p>
              <p className="text-sm text-muted-foreground">Organized for you</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.path} to={feature.path}>
              <Card variant="interactive" className="h-full group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Getting started */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Get started</h3>
            <p className="text-sm text-muted-foreground">
              Start by adding your first password or creating a note
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/notes">Add Note</Link>
            </Button>
            <Button asChild>
              <Link to="/passwords">Add Password</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
