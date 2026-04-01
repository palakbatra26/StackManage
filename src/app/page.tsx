'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibraryStore } from '@/store/library-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  LayoutDashboard, BookOpen, ArrowRightLeft, Activity, Settings, 
  LogOut, Search, Plus, Pencil, Trash2, Eye, Moon, Sun, Menu, X,
  AlertTriangle, CheckCircle, Clock, BookMarked, TrendingUp, 
  ChevronDown, Download, RefreshCw, Filter, ArrowUpDown, Lock
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';

// Types
interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  quantity: number;
  availableCopies: number;
  rackLocation: string | null;
  publishedYear: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Issue {
  id: string;
  bookId: string;
  book: Book;
  borrowerName: string;
  borrowerId: string | null;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'issued' | 'returned' | 'overdue';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  bookId: string | null;
  book: { title: string; author: string } | null;
  description: string;
  createdAt: string;
}

// Login Component
function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthenticated } = useLibraryStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAuthenticated(true);
        toast.success('Welcome back!');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <BookMarked className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Library Admin</CardTitle>
            <CardDescription>Enter password to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Default password: admin123
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Dashboard Component
function DashboardView() {
  const { 
    dashboardStats, lowStockBooks, recentlyIssued, categoryStats,
    setDashboardStats, setLowStockBooks, setRecentlyIssued, setCategoryStats,
    setCurrentView
  } = useLibraryStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data.stats);
        setLowStockBooks(data.lowStockBooks);
        setRecentlyIssued(data.recentlyIssued);
        setCategoryStats(data.categoryStats);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [setDashboardStats, setLowStockBooks, setRecentlyIssued, setCategoryStats]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading || !dashboardStats) {
    return <DashboardSkeleton />;
  }

  const statsCards = [
    { label: 'Total Books', value: dashboardStats.totalBooks, icon: BookOpen, color: 'text-foreground' },
    { label: 'Available Copies', value: dashboardStats.availableCopies, icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
    { label: 'Issued Books', value: dashboardStats.issuedBooks, icon: ArrowRightLeft, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Overdue Books', value: dashboardStats.overdueBooks, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <Button variant="outline" size="sm" onClick={fetchDashboard}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Availability Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Inventory Status</CardTitle>
          <CardDescription>
            {dashboardStats.availablePercentage}% of total copies available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={dashboardStats.availablePercentage} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Available: {dashboardStats.availableCopies}</span>
            <span>Total: {dashboardStats.totalCopies}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Books by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {categoryStats.map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <span className="text-sm">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(cat.count / dashboardStats.totalBooks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Books with 2 or fewer copies</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              {lowStockBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">All books are well stocked</p>
              ) : (
                <div className="space-y-2">
                  {lowStockBooks.map((book) => (
                    <div key={book.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                      <Badge variant={book.availableCopies === 0 ? 'destructive' : 'secondary'}>
                        {book.availableCopies}/{book.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recently Issued */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recently Issued</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('issues')}>
              View All <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {recentlyIssued.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No books currently issued</p>
            ) : (
              <div className="space-y-2">
                {recentlyIssued.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.book.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued to: {issue.borrowerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.status === 'overdue' ? 'destructive' : 'default'}>
                        {issue.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(issue.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-24" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// Books View Component
function BooksView() {
  const { 
    books, setBooks, searchQuery, setSearchQuery, 
    categoryFilter, setCategoryFilter, availabilityFilter, setAvailabilityFilter,
    isLoading, setIsLoading
  } = useLibraryStore();
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        availability: availabilityFilter === 'all' ? '' : availabilityFilter,
        sortBy,
        sortOrder
      });
      const res = await fetch(`/api/books?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
        // Extract unique categories
        const uniqueCategories = [...new Set(data.books.map((b: Book) => b.category))] as string[];
        setCategories(uniqueCategories);
      }
    } catch {
      toast.error('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, availabilityFilter, sortBy, sortOrder, setBooks, setIsLoading]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    try {
      const res = await fetch(`/api/books/${deletingBook.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Book deleted successfully');
        fetchBooks();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete book');
      }
    } catch {
      toast.error('Failed to delete book');
    } finally {
      setShowDeleteDialog(false);
      setDeletingBook(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Books</h2>
        <Button onClick={() => { setEditingBook(null); setShowBookDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          <ArrowUpDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Books Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No books found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Title</TableHead>
                    <TableHead className="w-[20%]">Author</TableHead>
                    <TableHead className="hidden md:table-cell">ISBN</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-center">Copies</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">{book.isbn}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{book.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={book.availableCopies === 0 ? 'destructive' : book.availableCopies < book.quantity ? 'default' : 'secondary'}>
                          {book.availableCopies}/{book.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setEditingBook(book); setShowBookDialog(true); }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => { setDeletingBook(book); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Book Dialog */}
      <BookFormDialog 
        open={showBookDialog} 
        onOpenChange={setShowBookDialog}
        book={editingBook}
        onSuccess={fetchBooks}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingBook?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Book Form Dialog
function BookFormDialog({ 
  open, 
  onOpenChange, 
  book, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  book: Book | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    quantity: '1',
    rackLocation: '',
    publishedYear: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        quantity: String(book.quantity),
        rackLocation: book.rackLocation || '',
        publishedYear: book.publishedYear ? String(book.publishedYear) : '',
        description: book.description || ''
      });
    } else {
      setFormData({
        title: '',
        author: '',
        isbn: '',
        category: '',
        quantity: '1',
        rackLocation: '',
        publishedYear: '',
        description: ''
      });
    }
  }, [book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = book ? `/api/books/${book.id}` : '/api/books';
      const method = book ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(book ? 'Book updated successfully' : 'Book added successfully');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to save book');
      }
    } catch {
      toast.error('Failed to save book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          <DialogDescription>
            {book ? 'Update the book details below.' : 'Fill in the details to add a new book.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN *</Label>
            <Input
              id="isbn"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Fiction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rackLocation">Rack Location</Label>
              <Input
                id="rackLocation"
                value={formData.rackLocation}
                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                placeholder="e.g., A-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishedYear">Published Year</Label>
              <Input
                id="publishedYear"
                type="number"
                value={formData.publishedYear}
                onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
                placeholder="e.g., 2023"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (book ? 'Update' : 'Add Book')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Issues View Component
function IssuesView() {
  const { issues, setIssues, issueStatusFilter, setIssueStatusFilter, setIsLoading } = useLibraryStore();
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: issueStatusFilter === 'all' ? '' : issueStatusFilter,
        search: searchQuery
      });
      const res = await fetch(`/api/issues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
      }
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  }, [issueStatusFilter, searchQuery, setIssues, setIsLoading]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleReturn = async () => {
    if (!selectedIssue) return;
    try {
      const res = await fetch('/api/issues/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: selectedIssue.id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.wasOverdue ? 'Book returned (was overdue)' : 'Book returned successfully');
        fetchIssues();
      } else {
        toast.error(data.error || 'Failed to return book');
      }
    } catch {
      toast.error('Failed to return book');
    } finally {
      setShowReturnDialog(false);
      setSelectedIssue(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge className="bg-blue-500">Issued</Badge>;
      case 'returned':
        return <Badge variant="secondary">Returned</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Issue / Return</h2>
        <Button onClick={() => setShowIssueDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Issue Book
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by borrower or book title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={issueStatusFilter} onValueChange={setIssueStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="issued">Issued</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {issues.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No issues found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{issue.book.title}</p>
                          <p className="text-xs text-muted-foreground">{issue.book.author}</p>
                        </div>
                      </TableCell>
                      <TableCell>{issue.borrowerName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {new Date(issue.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(issue.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell className="text-right">
                        {issue.status !== 'returned' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setSelectedIssue(issue); setShowReturnDialog(true); }}
                          >
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Issue Book Dialog */}
      <IssueBookDialog 
        open={showIssueDialog} 
        onOpenChange={setShowIssueDialog}
        onSuccess={fetchIssues}
      />

      {/* Return Confirmation */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Book</AlertDialogTitle>
            <AlertDialogDescription>
              Mark &quot;{selectedIssue?.book.title}&quot; as returned by {selectedIssue?.borrowerName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturn}>
              Confirm Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Issue Book Dialog
function IssueBookDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch available books
      fetch('/api/books?availability=available&limit=100')
        .then(res => res.json())
        .then(data => setBooks(data.books || []));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !borrowerName) {
      toast.error('Please select a book and enter borrower name');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBookId,
          borrowerName,
          borrowerId,
          dueDate: dueDate || undefined,
          notes
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Book issued successfully');
        onOpenChange(false);
        onSuccess();
        // Reset form
        setSelectedBookId('');
        setBorrowerName('');
        setBorrowerId('');
        setDueDate('');
        setNotes('');
      } else {
        toast.error(data.error || 'Failed to issue book');
      }
    } catch {
      toast.error('Failed to issue book');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default due date is 14 days from now
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>
            Select a book and enter borrower details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Book *</Label>
            <Select value={selectedBookId} onValueChange={setSelectedBookId} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} ({book.availableCopies} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrowerName">Borrower Name *</Label>
            <Input
              id="borrowerName"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrowerId">Borrower ID (Optional)</Label>
            <Input
              id="borrowerId"
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              placeholder={defaultDueDate}
            />
            <p className="text-xs text-muted-foreground">Default: 14 days from today</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Issuing...' : 'Issue Book'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Activity View Component
function ActivityView() {
  const { activityLogs, setActivityLogs, setIsLoading } = useLibraryStore();
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ action: actionFilter === 'all' ? '' : actionFilter });
      const res = await fetch(`/api/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs);
      }
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, setActivityLogs, setIsLoading]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'book_added': return <Plus className="w-4 h-4 text-green-500" />;
      case 'book_updated': return <Pencil className="w-4 h-4 text-blue-500" />;
      case 'book_deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'book_issued': return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
      case 'book_returned': return <CheckCircle className="w-4 h-4 text-teal-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Activity Logs</h2>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="book_added">Book Added</SelectItem>
            <SelectItem value="book_updated">Book Updated</SelectItem>
            <SelectItem value="book_deleted">Book Deleted</SelectItem>
            <SelectItem value="book_issued">Book Issued</SelectItem>
            <SelectItem value="book_returned">Book Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-320px)]">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity logs</p>
              </div>
            ) : (
              <div className="divide-y">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4">
                    <div className="mt-1">{getActionIcon(log.action)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{log.description}</p>
                      {log.book && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.book.title} by {log.book.author}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings View Component
function SettingsView() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async (type: 'books' | 'issues', format: 'csv' | 'excel') => {
    try {
      const res = await fetch(`/api/export?type=${type}&format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library_${type}.${format === 'csv' ? 'csv' : 'xls'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Password</CardTitle>
            <CardDescription>Update your admin password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Data</CardTitle>
            <CardDescription>Download your library data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Books Data</p>
                <p className="text-sm text-muted-foreground">Export all books information</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('books', 'csv')}>
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('books', 'excel')}>
                  Excel
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Issues Data</p>
                <p className="text-sm text-muted-foreground">Export all issue/return records</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('issues', 'csv')}>
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('issues', 'excel')}>
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar() {
  const { currentView, setCurrentView, setAuthenticated } = useLibraryStore();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'issues', label: 'Issue / Return', icon: ArrowRightLeft },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <div className="hidden md:flex flex-col h-full w-64 border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Library Admin</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentView === item.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-2 border-t space-y-1">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

// Mobile Bottom Navigation
function MobileNav() {
  const { currentView, setCurrentView } = useLibraryStore();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'books', icon: BookOpen, label: 'Books' },
    { id: 'issues', icon: ArrowRightLeft, label: 'Issues' },
    { id: 'activity', icon: Activity, label: 'Activity' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              currentView === item.id 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Mobile Header
function MobileHeader() {
  const { setAuthenticated } = useLibraryStore();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const mounted = useMounted();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <header className="md:hidden sticky top-0 z-40 border-b bg-background">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-semibold">Library Admin</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
      
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t"
          >
            <div className="p-2 space-y-1">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Main App Component
export default function LibraryApp() {
  const { isAuthenticated, setAuthenticated, currentView, setIsLoading } = useLibraryStore();
  const [isChecking, setIsChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        setAuthenticated(data.authenticated);
      } catch {
        setAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [setAuthenticated]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'books':
        return <BooksView />;
      case 'issues':
        return <IssuesView />;
      case 'activity':
        return <ActivityView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
