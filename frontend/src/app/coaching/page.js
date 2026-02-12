'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, 
  BarChart3, 
  BookOpen, 
  Brain, 
  Target,
  Settings,
  LogOut,
  Sparkles,
  Send,
  Loader2,
  Menu,
  X,
  User,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function CoachingPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const data = await api.getCoaching(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      toast.error(error.message || 'Erreur de communication');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue. Réessaie.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const quickQuestions = [
    "Comment améliorer mon winrate ?",
    "Analyse mes erreurs récentes",
    "Conseils pour la gestion des émotions",
    "Comment construire un plan de trading ?"
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target, active: true },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="font-heading font-bold text-lg tracking-tight uppercase">Trading AI</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                item.active 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-muted-foreground hover:text-white hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="font-bold text-primary">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.subscription || 'Free'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/settings" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 flex-1 flex flex-col pt-16 lg:pt-0">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">
            Coach IA Personnel
          </h1>
          <p className="text-muted-foreground text-sm">Pose tes questions, reçois des conseils personnalisés</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-bold uppercase mb-2">Ton Coach Trading</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Je connais ton profil, tes stats et tes difficultés. Pose-moi n'importe quelle question sur ton trading.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="btn-secondary text-xs py-2"
                    data-testid={`quick-q-${i}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-primary/20' : 'bg-zinc-800'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Bot className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className={`flex-1 max-w-2xl ${
                  msg.role === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-4 rounded-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-zinc-900 border border-zinc-800'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-zinc-800">
                <Bot className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Réflexion...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question..."
              className="input flex-1 min-h-[50px] max-h-[150px] resize-none"
              rows={1}
              data-testid="coaching-input"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary px-4"
              data-testid="coaching-send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
