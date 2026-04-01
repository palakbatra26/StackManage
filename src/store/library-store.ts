import { create } from 'zustand';

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

interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedBooks: number;
  overdueBooks: number;
  returnedBooks: number;
  availablePercentage: number;
}

interface LibraryState {
  isAuthenticated: boolean;
  currentView: 'dashboard' | 'books' | 'issues' | 'activity' | 'settings';
  books: Book[];
  issues: Issue[];
  activityLogs: ActivityLog[];
  dashboardStats: DashboardStats | null;
  lowStockBooks: Book[];
  recentlyIssued: Issue[];
  categoryStats: { category: string; count: number }[];
  searchQuery: string;
  categoryFilter: string;
  availabilityFilter: string;
  issueStatusFilter: string;
  isLoading: boolean;
  
  // Actions
  setAuthenticated: (value: boolean) => void;
  setCurrentView: (view: LibraryState['currentView']) => void;
  setBooks: (books: Book[]) => void;
  setIssues: (issues: Issue[]) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setLowStockBooks: (books: Book[]) => void;
  setRecentlyIssued: (issues: Issue[]) => void;
  setCategoryStats: (stats: { category: string; count: number }[]) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setAvailabilityFilter: (filter: string) => void;
  setIssueStatusFilter: (filter: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  isAuthenticated: false,
  currentView: 'dashboard',
  books: [],
  issues: [],
  activityLogs: [],
  dashboardStats: null,
  lowStockBooks: [],
  recentlyIssued: [],
  categoryStats: [],
  searchQuery: '',
  categoryFilter: 'all',
  availabilityFilter: 'all',
  issueStatusFilter: 'all',
  isLoading: false,
  
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setCurrentView: (view) => set({ currentView: view }),
  setBooks: (books) => set({ books }),
  setIssues: (issues) => set({ issues }),
  setActivityLogs: (logs) => set({ activityLogs: logs }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setLowStockBooks: (books) => set({ lowStockBooks: books }),
  setRecentlyIssued: (issues) => set({ recentlyIssued: issues }),
  setCategoryStats: (stats) => set({ categoryStats: stats }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setAvailabilityFilter: (filter) => set({ availabilityFilter: filter }),
  setIssueStatusFilter: (filter) => set({ issueStatusFilter: filter }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
