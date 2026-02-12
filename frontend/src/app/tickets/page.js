'use client';

import { useState, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Menu,
  X,
  Newspaper,
  MessageSquare,
  Sun,
  Moon,
  Plus,
  Send,
  Clock,
  User,
  Users,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: 'strategy', label: 'Stratégie', icon: '📊' },
  { id: 'psychology', label: 'Psychologie', icon: '🧠' },
  { id: 'technical', label: 'Analyse technique', icon: '📈' },
  { id: 'other', label: 'Autre', icon: '💬' },
];

const PRIORITIES = [
  { id: 'low', label: 'Basse', color: '#22C55E' },
  { id: 'normal', label: 'Normale', color: '#3B82F6' },
  { id: 'high', label: 'Haute', color: '#EF4444' },
];

const STATUS_STYLES = {
  open: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', label: 'Ouvert' },
  pending: { bg: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', label: 'En attente' },
  resolved: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', label: 'Résolu' },
  closed: { bg: 'rgba(113, 113, 122, 0.2)', color: '#71717A', label: 'Fermé' },
};

export default function TicketsPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'strategy',
    priority: 'normal',
    message: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await api.getTickets();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoadingDetail(true);
    try {
      const data = await api.getTicket(ticketId);
      setTicketDetail(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Remplis tous les champs');
      return;
    }
    
    setCreatingTicket(true);
    try {
      await api.createTicket(newTicket);
      toast.success('Ticket créé !');
      setShowNewTicket(false);
      setNewTicket({ subject: '', category: 'strategy', priority: 'normal', message: '' });
      loadTickets();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      await api.replyToTicket(selectedTicket, newMessage);
      setNewMessage('');
      loadTicketDetail(selectedTicket);
      toast.success('Message envoyé !');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      await api.closeTicket(selectedTicket);
      toast.success('Ticket fermé');
      loadTickets();
      setTicketDetail(null);
      setSelectedTicket(null);
    } catch (error) {
      toast.error('Erreur lors de la fermeture');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/calendar', label: 'Calendrier', icon: CalendarIcon },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare, active: true },
    { href: '/subscription', label: 'Abonnement', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b h-16 flex items-center justify-between px-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold tracking-tight uppercase">Trading AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'var(--card)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
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
                  : 'hover:bg-secondary'
              }`}
              style={{ color: item.active ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={toggleTheme} className="p-2 rounded-sm hover:bg-secondary">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/settings" className="p-2 rounded-sm hover:bg-secondary">
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-sm hover:bg-secondary">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">
                Consultations Experts
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>Échange avec des traders professionnels</p>
            </div>
            <button 
              onClick={() => setShowNewTicket(true)}
              className="btn-primary flex items-center gap-2"
              data-testid="new-ticket-btn"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Consultation
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="font-heading font-bold uppercase text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Mes Tickets ({tickets.length})
              </h2>
              
              {tickets.length === 0 ? (
                <div className="card text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>Aucun ticket</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div 
                    key={ticket.id}
                    onClick={() => loadTicketDetail(ticket.id)}
                    className={`card cursor-pointer transition-all ${selectedTicket === ticket.id ? 'border-primary' : ''}`}
                    data-testid={`ticket-${ticket.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ 
                          backgroundColor: STATUS_STYLES[ticket.status]?.bg,
                          color: STATUS_STYLES[ticket.status]?.color
                        }}
                      >
                        {STATUS_STYLES[ticket.status]?.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{ticket.subject}</h3>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <span>{CATEGORIES.find(c => c.id === ticket.category)?.icon}</span>
                      <span>{CATEGORIES.find(c => c.id === ticket.category)?.label}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ticket Detail / Conversation */}
            <div className="lg:col-span-2">
              {loadingDetail ? (
                <div className="card min-h-[500px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : ticketDetail ? (
                <div className="card min-h-[500px] flex flex-col">
                  {/* Ticket Header */}
                  <div className="border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="font-heading font-bold text-xl">{ticketDetail.subject}</h2>
                        <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                          <span>{CATEGORIES.find(c => c.id === ticketDetail.category)?.icon} {CATEGORIES.find(c => c.id === ticketDetail.category)?.label}</span>
                          <span>•</span>
                          <span>{formatDate(ticketDetail.created_at)}</span>
                        </div>
                      </div>
                      {ticketDetail.status !== 'closed' && (
                        <button 
                          onClick={handleCloseTicket}
                          className="btn-secondary text-xs"
                          data-testid="close-ticket-btn"
                        >
                          Fermer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                    {ticketDetail.messages?.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'user' ? 'bg-primary/20' : 'bg-secondary'
                        }`}>
                          {msg.sender === 'user' ? (
                            <User className="w-4 h-4 text-primary" />
                          ) : (
                            <Users className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                          )}
                        </div>
                        <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                            {msg.sender_name} • {formatDate(msg.created_at)}
                          </div>
                          <div 
                            className={`p-3 rounded-sm text-sm ${
                              msg.sender === 'user' ? 'bg-primary text-white' : ''
                            }`}
                            style={{ backgroundColor: msg.sender !== 'user' ? 'var(--secondary)' : undefined }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {ticketDetail.status !== 'closed' && (
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écris ton message..."
                        className="input flex-1"
                        data-testid="ticket-reply-input"
                      />
                      <button 
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="btn-primary px-4"
                        data-testid="send-reply-btn"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="card min-h-[500px] flex flex-col items-center justify-center text-center">
                  <Users className="w-16 h-16 mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="font-heading font-bold text-xl mb-2">Consulte nos Experts</h3>
                  <p className="max-w-md" style={{ color: 'var(--muted-foreground)' }}>
                    Sélectionne un ticket existant ou crée une nouvelle consultation pour discuter avec nos traders professionnels.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewTicket(false)} />
          <div className="relative w-full max-w-lg card" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl uppercase">Nouvelle Consultation</h2>
              <button onClick={() => setShowNewTicket(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sujet *</label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  placeholder="Ex: Améliorer mon entrée en position"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  data-testid="ticket-subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewTicket({ ...newTicket, category: cat.id })}
                      className={`p-3 rounded-sm text-sm font-medium transition-all ${
                        newTicket.category === cat.id ? 'bg-primary text-white' : ''
                      }`}
                      style={{ backgroundColor: newTicket.category !== cat.id ? 'var(--secondary)' : undefined }}
                      data-testid={`category-${cat.id}`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewTicket({ ...newTicket, priority: p.id })}
                      className={`flex-1 p-2 rounded-sm text-sm font-medium transition-all`}
                      style={{ 
                        backgroundColor: newTicket.priority === p.id ? p.color : 'var(--secondary)',
                        color: newTicket.priority === p.id ? 'white' : 'var(--foreground)'
                      }}
                      data-testid={`priority-${p.id}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea
                  required
                  rows={4}
                  className="input w-full resize-none"
                  placeholder="Décris ta question ou ton problème en détail..."
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  data-testid="ticket-message"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={creatingTicket}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  data-testid="submit-ticket"
                >
                  {creatingTicket ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
