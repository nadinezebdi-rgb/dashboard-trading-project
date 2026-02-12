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
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Users,
  Trophy,
  TrendingDown,
  HelpCircle,
  GraduationCap,
  Image as ImageIcon,
  Send,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { api } from '@/lib/api';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'setup', label: 'Setups', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'win', label: 'Wins', icon: <Trophy className="w-4 h-4" /> },
  { id: 'loss', label: 'Losses', icon: <TrendingDown className="w-4 h-4" /> },
  { id: 'experience', label: 'Expériences', icon: <Users className="w-4 h-4" /> },
  { id: 'question', label: 'Questions', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'education', label: 'Éducation', icon: <GraduationCap className="w-4 h-4" /> },
];

const CATEGORY_COLORS = {
  setup: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3B82F6' },
  win: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22C55E' },
  loss: { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444' },
  experience: { bg: 'rgba(168, 85, 247, 0.2)', text: '#A855F7' },
  question: { bg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' },
  education: { bg: 'rgba(6, 182, 212, 0.2)', text: '#06B6D4' },
};

const LEVEL_LABELS = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert'
};

export default function CommunityPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postDetail, setPostDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'experience',
    tags: []
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getCommunityPosts(selectedCategory);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPostDetail = async (postId) => {
    setSelectedPost(postId);
    setLoadingDetail(true);
    try {
      const data = await api.getPostDetail(postId);
      setPostDetail(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) {
      toast.error('Remplis le titre et le contenu');
      return;
    }
    
    setCreatingPost(true);
    try {
      let screenshotBase64 = null;
      if (screenshotPreview) {
        screenshotBase64 = screenshotPreview.split(',')[1];
      }
      
      await api.createPost({
        ...newPost,
        screenshot_base64: screenshotBase64
      });
      toast.success('Post publié !');
      setShowNewPost(false);
      setNewPost({ title: '', content: '', category: 'experience', tags: [] });
      setScreenshot(null);
      setScreenshotPreview(null);
      loadPosts();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLikePost = async (postId, e) => {
    e.stopPropagation();
    try {
      const result = await api.togglePostLike(postId);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            is_liked: result.liked,
            likes_count: result.liked ? p.likes_count + 1 : p.likes_count - 1
          };
        }
        return p;
      }));
      if (postDetail && postDetail.id === postId) {
        setPostDetail({
          ...postDetail,
          is_liked: result.liked,
          likes_count: result.liked ? postDetail.likes_count + 1 : postDetail.likes_count - 1
        });
      }
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSendingComment(true);
    try {
      await api.addComment(selectedPost, newComment);
      setNewComment('');
      loadPostDetail(selectedPost);
      toast.success('Commentaire ajouté !');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Supprimer ce post ?')) return;
    try {
      await api.deletePost(postId);
      toast.success('Post supprimé');
      setPostDetail(null);
      setSelectedPost(null);
      loadPosts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
    { href: '/community', label: 'Communauté', icon: Users, active: true },
    { href: '/economic', label: 'Économie', icon: Newspaper },
    { href: '/analysis', label: 'Analyse IA', icon: Brain },
    { href: '/coaching', label: 'Coaching', icon: Target },
    { href: '/tickets', label: 'Experts', icon: MessageSquare },
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

        <nav className="p-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
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
          <div className="flex items-center justify-between">
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
                Communauté
              </h1>
              <p style={{ color: 'var(--muted-foreground)' }}>Partage et apprends avec d'autres traders</p>
            </div>
            <button 
              onClick={() => setShowNewPost(true)}
              className="btn-primary flex items-center gap-2"
              data-testid="new-post-btn"
            >
              <Plus className="w-4 h-4" />
              Nouveau Post
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'
                }`}
                data-testid={`category-${cat.id}`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-2 space-y-4">
              {posts.length === 0 ? (
                <div className="card text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="font-heading font-bold text-xl mb-2">Aucun post</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>Sois le premier à partager !</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div 
                    key={post.id}
                    onClick={() => loadPostDetail(post.id)}
                    className={`card cursor-pointer transition-all hover:border-primary/30 ${selectedPost === post.id ? 'border-primary' : ''}`}
                    data-testid={`post-${post.id}`}
                  >
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-primary">{post.author_name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-bold">{post.author_name}</div>
                          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {LEVEL_LABELS[post.author_level] || 'Trader'} • {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-bold uppercase"
                        style={{ 
                          backgroundColor: CATEGORY_COLORS[post.category]?.bg || 'var(--secondary)',
                          color: CATEGORY_COLORS[post.category]?.text || 'var(--foreground)'
                        }}
                      >
                        {CATEGORIES.find(c => c.id === post.category)?.label}
                      </span>
                    </div>

                    {/* Post Content */}
                    <h3 className="font-heading font-bold text-lg mb-2">{post.title}</h3>
                    <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--muted-foreground)' }}>
                      {post.content}
                    </p>

                    {post.has_screenshot && (
                      <div className="mb-4 p-2 rounded-sm flex items-center gap-2" style={{ backgroundColor: 'var(--secondary)' }}>
                        <ImageIcon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Contient une image</span>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button 
                        onClick={(e) => handleLikePost(post.id, e)}
                        className={`flex items-center gap-2 text-sm transition-colors ${post.is_liked ? 'text-red-500' : ''}`}
                        style={{ color: post.is_liked ? '#EF4444' : 'var(--muted-foreground)' }}
                        data-testid={`like-${post.id}`}
                      >
                        <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-current' : ''}`} />
                        {post.likes_count}
                      </button>
                      <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        <MessageCircle className="w-4 h-4" />
                        {post.comments_count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Detail / Sidebar */}
            <div className="lg:col-span-1">
              {loadingDetail ? (
                <div className="card min-h-[400px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : postDetail ? (
                <div className="card min-h-[400px] sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto">
                  {/* Detail Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-bold text-primary">{postDetail.author_name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-bold">{postDetail.author_name}</div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {formatDate(postDetail.created_at)}
                        </div>
                      </div>
                    </div>
                    {postDetail.author_id === user.id && (
                      <button 
                        onClick={() => handleDeletePost(postDetail.id)}
                        className="p-2 rounded-sm hover:bg-secondary"
                        style={{ color: 'var(--loss)' }}
                        data-testid="delete-post-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h2 className="font-heading font-bold text-xl mb-3">{postDetail.title}</h2>
                  <p className="text-sm whitespace-pre-wrap mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    {postDetail.content}
                  </p>

                  {postDetail.screenshot && (
                    <img 
                      src={`data:image/jpeg;base64,${postDetail.screenshot}`}
                      alt="Screenshot"
                      className="w-full rounded-sm mb-4 border"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 py-3 border-y mb-4" style={{ borderColor: 'var(--border)' }}>
                    <button 
                      onClick={(e) => handleLikePost(postDetail.id, e)}
                      className={`flex items-center gap-2 ${postDetail.is_liked ? 'text-red-500' : ''}`}
                      style={{ color: postDetail.is_liked ? '#EF4444' : 'var(--muted-foreground)' }}
                    >
                      <Heart className={`w-5 h-5 ${postDetail.is_liked ? 'fill-current' : ''}`} />
                      {postDetail.likes_count}
                    </button>
                    <span className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                      <MessageCircle className="w-5 h-5" />
                      {postDetail.comments_count}
                    </span>
                  </div>

                  {/* Comments */}
                  <h3 className="font-bold text-sm uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Commentaires ({postDetail.comments?.length || 0})
                  </h3>
                  
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {postDetail.comments?.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-sm" style={{ backgroundColor: 'var(--secondary)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{comment.author_name}</span>
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{comment.content}</p>
                      </div>
                    ))}
                    {(!postDetail.comments || postDetail.comments.length === 0) && (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                        Aucun commentaire
                      </p>
                    )}
                  </div>

                  {/* Add Comment */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="input flex-1"
                      data-testid="comment-input"
                    />
                    <button 
                      type="submit"
                      disabled={sendingComment || !newComment.trim()}
                      className="btn-primary px-3"
                      data-testid="send-comment-btn"
                    >
                      {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="card min-h-[400px] flex flex-col items-center justify-center text-center">
                  <Users className="w-16 h-16 mb-4 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
                  <h3 className="font-heading font-bold text-lg mb-2">Communauté Trading</h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Sélectionne un post pour voir les détails et commentaires
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewPost(false)} />
          <div className="relative w-full max-w-lg card max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl uppercase">Nouveau Post</h2>
              <button onClick={() => setShowNewPost(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewPost({ ...newPost, category: cat.id })}
                      className={`p-2 rounded-sm text-xs font-medium transition-all flex items-center justify-center gap-1`}
                      style={{ 
                        backgroundColor: newPost.category === cat.id ? CATEGORY_COLORS[cat.id]?.bg : 'var(--secondary)',
                        color: newPost.category === cat.id ? CATEGORY_COLORS[cat.id]?.text : 'var(--foreground)'
                      }}
                      data-testid={`new-post-category-${cat.id}`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  placeholder="Ex: Mon premier trade profitable sur BTC"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  data-testid="new-post-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contenu *</label>
                <textarea
                  required
                  rows={5}
                  className="input w-full resize-none"
                  placeholder="Partage ton expérience, ton setup, tes leçons..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  data-testid="new-post-content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image (optionnel)</label>
                {screenshotPreview ? (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Preview" className="w-full rounded-sm" />
                    <button
                      type="button"
                      onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                      className="absolute top-2 right-2 p-1 rounded-sm"
                      style={{ backgroundColor: 'var(--card)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-sm cursor-pointer transition-colors hover:border-primary/50" style={{ borderColor: 'var(--border)' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                      data-testid="new-post-image"
                    />
                    <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'var(--muted-foreground)' }} />
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cliquer pour ajouter</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowNewPost(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={creatingPost}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  data-testid="submit-post"
                >
                  {creatingPost ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publier
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
