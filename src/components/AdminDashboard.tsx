import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, LogOut, Search, Filter, Phone, Mail,
  Clock, CheckCircle2, XCircle, PauseCircle, CircleDot,
  Inbox, TrendingUp, ArrowLeft, CalendarDays, Download, RotateCcw, Pencil, Trash2, Save, X,
  Loader2, Menu, Calculator, Briefcase,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  deleteCustomerLead,
  fetchDeletedCustomerLeads,
  fetchCustomerLeads,
  hasPendingOperations,
  permanentlyDeleteCustomerLead,
  purgeOldDeletedCustomerLeads,
  restoreCustomerLead,
  syncPendingOperations,
  updateCustomerLeadDetails,
  updateCustomerLeadPaymentStatus,
  updateCustomerLeadStatus,
} from '@/lib/firebase';

type Submission = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  status: string;
  payment_status?: 'done' | 'pending';
  notification_status: string;
  created_at: string;
  deleted_at?: string;
};

type StatusOption = {
  value: string;
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
};

type DiaryEntry = {
  id: string;
  customerName: string;
  amount: number;
  note: string;
  paymentStatus: 'received' | 'pending';
  createdAt: string;
};

const statusOptions: StatusOption[] = [
  { value: 'new', label: 'New', icon: CircleDot, color: 'text-ice-300', bgColor: 'bg-ice-500/10' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { value: 'on_hold', label: 'On Hold', icon: PauseCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-aluminum-300', bgColor: 'bg-aluminum-500/10' },
];

const allStatuses = ['new', 'accepted', 'on_hold', 'rejected', 'completed'];
const CURRENT_DIARY_KEY = 'dm-aluminium-current-day-ledger';
const DAILY_BOOK_KEY = 'dm-aluminium-daily-payment-book';
const LAST_DAY_KEY = 'dm-aluminium-last-ledger-day';

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKey(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [recycleBin, setRecycleBin] = useState<Submission[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<Submission | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', project_type: '', message: '' });
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [followToday, setFollowToday] = useState(true);
  const [taskView, setTaskView] = useState<'all' | 'new' | 'pending'>('all');
  const [calculatorDisplay, setCalculatorDisplay] = useState('0');
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [dailyBook, setDailyBook] = useState<DiaryEntry[]>([]);
  const [activeSection, setActiveSection] = useState('records');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const projectTypes = [
    'Aluminium Fabrication', 'Tuffen Glass & Sliding Door', 'Aluminium Window & UPVC',
    'Railing', 'Welding', 'Steel Fitting', 'Interior Works', 'Other / Not Sure Yet',
  ];

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchCustomerLeads();
      setAllSubmissions(data as Submission[]);
    } catch {
      setError('Unable to load submissions.');
      setAllSubmissions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    setPendingCount(hasPendingOperations() ? 1 : 0);

    const trySync = async () => {
      if (!hasPendingOperations()) return;
      setSyncing(true);
      try {
        const { synced, remaining } = await syncPendingOperations();
        if (synced > 0) {
          setSuccessMessage(`${synced} pending change(s) synced to Firestore.`);
          void fetchSubmissions();
        }
        setPendingCount(remaining);
      } catch {
        void 0;
      }
      setSyncing(false);
    };

    void trySync();
  }, [fetchSubmissions]);

  useEffect(() => {
    let data = allSubmissions;

    if (statusFilter !== 'all') {
      data = data.filter((item) => item.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      data = data.filter((item) => item.project_type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          (item.phone ?? '').includes(q),
      );
    }

    setSubmissions(data);
  }, [allSubmissions, statusFilter, typeFilter, search]);

  const fetchRecycleBin = useCallback(async () => {
    try {
      setRecycleBin(await fetchDeletedCustomerLeads() as Submission[]);
    } catch {
      setError('Unable to load the recycle bin.');
    }
  }, []);

  useEffect(() => {
    void fetchRecycleBin();
  }, [fetchRecycleBin]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const previousSubmissions = allSubmissions;
    const updateStatus = (submission: Submission) =>
      submission.id === id ? { ...submission, status: newStatus } : submission;

    setSubmissions((prev) => prev.map(updateStatus));
    setAllSubmissions((prev) => prev.map(updateStatus));
    setUpdatingId(id);

    try {
      const { persisted } = await updateCustomerLeadStatus(id, newStatus);
      if (persisted) {
        setSuccessMessage('Task status updated successfully.');
      } else {
        setPendingCount(1);
        setSuccessMessage('Status saved locally. Will sync to Firestore when connection returns.');
      }
    } catch {
      setAllSubmissions(previousSubmissions);
      setSubmissions(previousSubmissions);
      setError('Unable to update status.');
    }

    setUpdatingId(null);
  };

  const handlePaymentStatusChange = async (id: string, paymentStatus: 'done' | 'pending') => {
    const previousSubmissions = allSubmissions;
    const updatePayment = (submission: Submission) =>
      submission.id === id ? { ...submission, payment_status: paymentStatus } : submission;

    setSubmissions((prev) => prev.map(updatePayment));
    setAllSubmissions((prev) => prev.map(updatePayment));
    setUpdatingId(id);

    try {
      const { persisted } = await updateCustomerLeadPaymentStatus(id, paymentStatus);
      if (persisted) {
        setSuccessMessage('Payment status updated successfully.');
      } else {
        setPendingCount(1);
        setSuccessMessage('Payment status saved locally. Will sync to Firestore when connection returns.');
      }
    } catch {
      setAllSubmissions(previousSubmissions);
      setSubmissions(previousSubmissions);
      setError('Unable to update payment status.');
    }

    setUpdatingId(null);
  };

  const startEditing = (submission: Submission) => {
    setEditingId(submission.id);
    setEditForm({
      name: submission.name,
      email: submission.email,
      phone: submission.phone ?? '',
      project_type: submission.project_type ?? '',
      message: submission.message,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: '', email: '', phone: '', project_type: '', message: '' });
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.message.trim()) {
      setError('Name, email, and message are required.');
      return;
    }

    setUpdatingId(id);
    try {
      const details = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        project_type: editForm.project_type || null,
        message: editForm.message.trim(),
      };
      const { persisted } = await updateCustomerLeadDetails(id, details);
      const updateDetails = (submission: Submission) =>
        submission.id === id ? { ...submission, ...details } : submission;
      setSubmissions((prev) => prev.map(updateDetails));
      setAllSubmissions((prev) => prev.map(updateDetails));
      cancelEditing();
      if (persisted) {
        setSuccessMessage('Customer task updated successfully.');
      } else {
        setPendingCount(1);
        setSuccessMessage('Edit saved locally. Will sync to Firestore when connection returns.');
      }
    } catch {
      setError('Unable to update customer task.');
    }
    setUpdatingId(null);
  };

  const removeSubmission = async (submission: Submission) => {
    setUpdatingId(submission.id);
    try {
      const { persisted } = await deleteCustomerLead(submission.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      setAllSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      setRecycleBin((prev) => [{ ...submission, deleted_at: new Date().toISOString() }, ...prev]);
      setDeleteCandidate(null);
      if (persisted) {
        setSuccessMessage('Customer enquiry deleted.');
      } else {
        setPendingCount(1);
        setSuccessMessage('Delete saved locally. Will sync to Firestore when connection returns.');
      }
    } catch {
      setError('Unable to delete customer enquiry.');
    }
    setUpdatingId(null);
  };

  const restoreSubmission = async (submission: Submission) => {
    const { persisted } = await restoreCustomerLead(submission.id);
    setRecycleBin((prev) => prev.filter((item) => item.id !== submission.id));
    await fetchSubmissions();
    if (persisted) {
      setSuccessMessage(`${submission.name} restored from the recycle bin.`);
    } else {
      setPendingCount(1);
      setSuccessMessage(`${submission.name} restored locally. Will sync to Firestore when connection returns.`);
    }
  };

  const permanentlyDeleteSubmission = async (submission: Submission) => {
    if (!window.confirm(`Permanently delete ${submission.name}? This cannot be undone.`)) return;
    const { persisted } = await permanentlyDeleteCustomerLead(submission.id);
    setRecycleBin((prev) => prev.filter((item) => item.id !== submission.id));
    if (persisted) {
      setSuccessMessage(`${submission.name} permanently deleted.`);
    } else {
      setPendingCount(1);
      setSuccessMessage(`${submission.name} removed locally. Will sync to Firestore when connection returns.`);
    }
  };

  const cleanupRecycleBin = async (days: number) => {
    try {
      const { removed, persisted } = await purgeOldDeletedCustomerLeads(days);
      await fetchRecycleBin();
      if (persisted) {
        setSuccessMessage(`${removed} old deleted record(s) were removed from storage. ${days}-day retention applied.`);
      } else {
        setPendingCount(1);
        setSuccessMessage(`${removed} record(s) removed locally. Will sync to Firestore when connection returns.`);
      }
    } catch {
      setError('Unable to clean old deleted records.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setTaskView('all');
  };

  const exportSubmissions = () => {
    const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Message', 'Status', 'Payment Status', 'Created At'];
    const rows = allSubmissions.map((submission) => [
      submission.name,
      submission.email,
      submission.phone ?? '',
      submission.project_type ?? '',
      submission.message,
      getStatusInfo(submission.status).label,
      submission.payment_status === 'done' ? 'Payment done' : 'Payment pending',
      formatDate(submission.created_at),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dm-aluminium-backup-${getTodayKey()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Backup exported successfully.');
  };

  const counts = allStatuses.reduce((acc, status) => {
    acc[status] = allSubmissions.filter((s) => s.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const total = allSubmissions.length;
  const newWorks = allSubmissions.filter((submission) => getDateKey(submission.created_at) === selectedDate);
  const pendingWorks = allSubmissions.filter(
    (submission) => getDateKey(submission.created_at) < selectedDate
      && !['completed', 'rejected'].includes(submission.status),
  );
  const selectedDayTasks = allSubmissions
    .filter((submission) => getDateKey(submission.created_at) === selectedDate)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visibleSubmissions = taskView === 'new'
    ? newWorks
    : taskView === 'pending'
      ? pendingWorks
      : statusFilter === 'completed'
        ? submissions
        : submissions.filter((submission) => submission.status !== 'completed');

  const workSubmissions = allSubmissions.filter((s) =>
    ['new', 'accepted', 'on_hold'].includes(s.status),
  );

  const resetCalculator = () => {
    setCalculatorDisplay('0');
    setCalculatorExpression('');
  };

  const handleCalculatorInput = (value: string) => {
    if (value === 'C') {
      resetCalculator();
      return;
    }

    if (value === 'DEL') {
      const nextExpression = calculatorExpression.slice(0, -1);
      const nextDisplay = nextExpression === '' ? '0' : nextExpression;
      setCalculatorExpression(nextExpression);
      setCalculatorDisplay(nextDisplay);
      return;
    }

    if (value === '=') {
      if (!calculatorExpression) {
        return;
      }

      try {
        if (!/^[0-9+\-*/.\s]+$/.test(calculatorExpression)) {
          throw new Error('Invalid');
        }
        const sanitizedExpression = calculatorExpression.replace(/×/g, '*').replace(/÷/g, '/');
        const result = Function(`"use strict"; return (${sanitizedExpression});`)();
        if (!Number.isFinite(result)) {
          throw new Error('Invalid');
        }
        const formattedResult = Number.isInteger(result)
          ? String(result)
          : Number(result.toFixed(10)).toString();
        setCalculatorDisplay(formattedResult);
        setCalculatorExpression(formattedResult);
      } catch {
        setCalculatorDisplay('Error');
        setCalculatorExpression('');
      }
      return;
    }

    if (['+', '-', '*', '/'].includes(value)) {
      const nextExpression = calculatorExpression === '' ? `0${value}` : `${calculatorExpression}${value}`;
      setCalculatorExpression(nextExpression);
      setCalculatorDisplay(value);
      return;
    }

    const nextExpression = `${calculatorExpression}${value}`;
    const nextDisplay = calculatorDisplay === '0' && value !== '.' ? value : `${calculatorDisplay}${value}`;
    setCalculatorExpression(nextExpression);
    setCalculatorDisplay(nextDisplay);
  };

  const calculatorRows = [
    ['C', 'DEL', '/', '*'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.'],
  ];

  useEffect(() => {
    const savedBook = localStorage.getItem(DAILY_BOOK_KEY);
    const savedCurrent = localStorage.getItem(CURRENT_DIARY_KEY);
    const lastDay = localStorage.getItem(LAST_DAY_KEY) || getTodayKey();
    const todayKey = getTodayKey();

    if (savedBook) {
      try {
        const parsed = JSON.parse(savedBook) as DiaryEntry[];
        if (Array.isArray(parsed)) setDailyBook(parsed);
      } catch {
        localStorage.removeItem(DAILY_BOOK_KEY);
      }
    }

    if (savedCurrent) {
      try {
        const parsed = JSON.parse(savedCurrent) as DiaryEntry[];
        if (Array.isArray(parsed)) setDiaryEntries(parsed);
      } catch {
        localStorage.removeItem(CURRENT_DIARY_KEY);
      }
    }

    if (lastDay !== todayKey) {
      const archived = JSON.parse(savedCurrent || '[]') as DiaryEntry[];
      if (archived.length > 0) {
        const mergedBook = [...archived, ...((savedBook ? JSON.parse(savedBook) : []) as DiaryEntry[])];
        setDailyBook(mergedBook);
        localStorage.setItem(DAILY_BOOK_KEY, JSON.stringify(mergedBook));
        setDiaryEntries([]);
        localStorage.setItem(CURRENT_DIARY_KEY, JSON.stringify([]));
      }
      localStorage.setItem(LAST_DAY_KEY, todayKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CURRENT_DIARY_KEY, JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem(DAILY_BOOK_KEY, JSON.stringify(dailyBook));
  }, [dailyBook]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const todayKey = getTodayKey();
      const lastDay = localStorage.getItem(LAST_DAY_KEY) || todayKey;

      if (followToday && selectedDate !== todayKey) {
        setSelectedDate(todayKey);
      }

      if (lastDay !== todayKey && diaryEntries.length > 0) {
        const archived = diaryEntries;
        const existingBook = JSON.parse(localStorage.getItem(DAILY_BOOK_KEY) || '[]') as DiaryEntry[];
        const mergedBook = [...archived, ...existingBook];
        setDailyBook(mergedBook);
        setDiaryEntries([]);
        localStorage.setItem(CURRENT_DIARY_KEY, JSON.stringify([]));
        localStorage.setItem(DAILY_BOOK_KEY, JSON.stringify(mergedBook));
        localStorage.setItem(LAST_DAY_KEY, todayKey);
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, [diaryEntries, followToday, selectedDate]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDateKey = (dateKey: string) => {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getStatusInfo = (status: string) =>
    statusOptions.find((s) => s.value === status) ?? statusOptions[0];

  const statCards = [
    { label: 'Total', value: total, filter: 'all', icon: Inbox, color: 'text-white', bgColor: 'bg-charcoal-700' },
    { label: 'Accepted', value: counts.accepted ?? 0, filter: 'accepted', icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-500/10' },
    { label: 'On Hold', value: counts.on_hold ?? 0, filter: 'on_hold', icon: PauseCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
    { label: 'Rejected', value: counts.rejected ?? 0, filter: 'rejected', icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
    { label: 'Completed', value: counts.completed ?? 0, filter: 'completed', icon: TrendingUp, color: 'text-aluminum-300', bgColor: 'bg-aluminum-500/10' },
  ];

  const dailyStatCards = [
    { label: 'New Works', value: newWorks.length, view: 'new' as const, icon: CircleDot, color: 'text-ice-300', bgColor: 'bg-ice-500/10' },
    { label: 'Pending', value: pendingWorks.length, view: 'pending' as const, icon: PauseCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  ];

  const navSections = [
    {
      category: 'Overview',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      category: 'Customer & Work Records',
      items: [
        { id: 'records', label: 'All Records', icon: Inbox },
        { id: 'work', label: 'Work Management', icon: Briefcase },
      ],
    },
    {
      category: 'Daily Operations',
      items: [
        { id: 'daily', label: 'Diary & Schedule', icon: CalendarDays },
      ],
    },
    {
      category: 'Tools',
      items: [
        { id: 'tools', label: 'Calculator & Export', icon: Calculator },
        { id: 'recycle', label: 'Recycle Bin', icon: Trash2, badge: recycleBin.length },
      ],
    },
  ];

  const sectionTitles: Record<string, string> = {
    overview: 'Dashboard Overview',
    records: 'Customer & Work Records',
    work: 'Work Management',
    daily: 'Daily Operations',
    tools: 'Calculator & Export',
    recycle: 'Recycle Bin',
  };

  const sectionTitle = sectionTitles[activeSection] ?? 'Dashboard';

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    setError('');
    setSuccessMessage('');
    if (sectionId === 'recycle') {
      void fetchRecycleBin();
    }
  };

  const renderSubmissionCard = (submission: Submission) => {
    const statusInfo = getStatusInfo(submission.status);
    const StatusIcon = statusInfo.icon;
    return (
      <div key={submission.id} className="rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-white">{submission.name}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}>
                <StatusIcon size={14} />
                {statusInfo.label}
              </span>
            </div>
            <div className="grid gap-2 text-sm text-aluminum-300 sm:grid-cols-2">
              <p className="flex items-center gap-2"><Mail size={14} className="text-ice-300" /> {submission.email}</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-ice-300" /> {submission.phone || 'Not provided'}</p>
              <p className="flex items-center gap-2"><Clock size={14} className="text-ice-300" /> {formatDate(submission.created_at)}</p>
              <p className="flex items-center gap-2"><LayoutDashboard size={14} className="text-ice-300" /> {submission.project_type || 'Not specified'}</p>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-aluminum-200">{submission.message}</p>
          </div>

          <div className="w-full max-w-xs">
            <div className="mb-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => startEditing(submission)}
                disabled={updatingId === submission.id}
                className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-aluminum-200 transition-colors hover:border-ice-400/40 hover:text-white disabled:opacity-50"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteCandidate(submission)}
                disabled={updatingId === submission.id}
                className="flex items-center gap-1.5 rounded-md border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>

            {editingId === submission.id && (
              <div className="mb-4 space-y-3 rounded-lg border border-ice-400/30 bg-charcoal-900 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ice-300">Edit enquiry</p>
                  <button type="button" onClick={cancelEditing} className="text-aluminum-400 hover:text-white" aria-label="Cancel editing">
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Customer name"
                  className="w-full rounded-md border border-white/10 bg-charcoal-800 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  className="w-full rounded-md border border-white/10 bg-charcoal-800 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                />
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                  className="w-full rounded-md border border-white/10 bg-charcoal-800 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                />
                <select
                  value={editForm.project_type}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, project_type: event.target.value }))}
                  className="w-full rounded-md border border-white/10 bg-charcoal-800 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                >
                  <option value="">Project type</option>
                  {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <textarea
                  rows={4}
                  value={editForm.message}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="Progress or customer message"
                  className="w-full resize-none rounded-md border border-white/10 bg-charcoal-800 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                />
                <button
                  type="button"
                  onClick={() => void saveEdit(submission.id)}
                  disabled={updatingId === submission.id}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-ice-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-ice-400 disabled:opacity-50"
                >
                  <Save size={15} />
                  Save changes
                </button>
              </div>
            )}

            <label htmlFor={`status-${submission.id}`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-400">
              Update status
            </label>
            <select
              id={`status-${submission.id}`}
              value={submission.status}
              disabled={updatingId === submission.id}
              onChange={(e) => void handleStatusChange(submission.id, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-charcoal-900 px-3 py-2.5 text-sm text-white focus:border-ice-400 focus:outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="mt-3 rounded-lg border border-ice-500/20 bg-ice-500/5 p-3 text-sm text-aluminum-200">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ice-300">Payment status</p>
                <button
                  type="button"
                  disabled={updatingId === submission.id}
                  aria-label={submission.payment_status === 'done' ? 'Mark payment pending' : 'Mark payment received'}
                  onClick={() => void handlePaymentStatusChange(submission.id, submission.payment_status === 'done' ? 'pending' : 'done')}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${submission.payment_status === 'done'
                    ? 'border-green-400/40 bg-green-500/20 text-green-300'
                    : 'border-yellow-400/30 bg-charcoal-900 text-yellow-300 hover:border-yellow-400/50'}`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[11px] ${submission.payment_status === 'done'
                    ? 'border-green-300 bg-green-400 text-charcoal-950'
                    : 'border-yellow-300/60'}`}
                  >
                    {submission.payment_status === 'done' ? '✓' : ''}
                  </span>
                  {submission.payment_status === 'done' ? 'Payment received' : 'Payment pending'}
                </button>
              </div>
              {submission.status === 'completed' && (
                <>
                  <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-ice-300">Progress report</p>
                  <p className="whitespace-pre-line leading-relaxed">{submission.message || 'No details added for this completed job.'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatCards = (cards: typeof statCards, dailyCards: typeof dailyStatCards) => (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
      {[cards[0], dailyCards[0], dailyCards[1], ...cards.slice(1)].map((stat) => {
        const Icon = stat.icon;
        const isDailyCard = 'view' in stat;
        const isSelected = isDailyCard ? taskView === stat.view : statusFilter === stat.filter;
        return (
          <button
            key={stat.label}
            type="button"
            onClick={() => {
              if (isDailyCard) {
                setTaskView(stat.view);
                setStatusFilter('all');
              } else {
                setTaskView('all');
                setStatusFilter(stat.filter);
              }
            }}
            className={`w-full rounded-xl border p-4 text-left transition-all hover:border-ice-300/60 ${stat.bgColor} ${isSelected ? 'border-ice-300 ring-2 ring-ice-300/30' : 'border-white/5'}`}
            aria-pressed={isSelected}
          >
            <div className="flex items-center justify-between">
              <Icon size={20} className={stat.color} />
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-aluminum-400">{stat.label}</p>
          </button>
        );
      })}
    </div>
  );

  const renderBismillah = () => (
    <section className="mb-8 dashboard-bismillah" aria-label="In the name of Allah">
      <div className="dashboard-bismillah__surface">
        <div className="dashboard-bismillah__glow" />
        <div className="dashboard-bismillah__arabic" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </div>
        <div className="dashboard-bismillah__rule" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <div className="dashboard-bismillah__english">IN THE NAME OF ALLAH</div>
      </div>
    </section>
  );

  const renderStatusBar = () => (
    <>
      {(pendingCount > 0 || syncing) && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          {syncing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Syncing pending changes to Firestore...
            </>
          ) : (
            <>
              <Clock size={16} className="flex-shrink-0" />
              {pendingCount} change(s) saved locally, waiting for Firestore connection to sync.
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-400/25 bg-green-500/10 p-3 text-sm text-green-200" role="status">
          {successMessage}
        </div>
      )}
    </>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-aluminum-300 via-aluminum-100 to-aluminum-400 shadow-md">
          <span className="text-sm font-bold text-charcoal-900">DM</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-white">DM Aluminium</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ice-300">Admin Panel</span>
        </div>
        <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto text-aluminum-400 hover:text-white lg:hidden" aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.category} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-aluminum-500">{section.category}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const badge = 'badge' in item ? item.badge : 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-ice-500/10 text-ice-300'
                        : 'text-aluminum-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-ice-300' : 'text-aluminum-400'} />
                    {item.label}
                    {badge !== undefined && badge > 0 && (
                      <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-200">{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-3 py-4">
        <div className="mb-2 truncate px-3 text-xs text-aluminum-400">{user?.email}</div>
        <a href="/" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-aluminum-300 transition-colors hover:bg-white/5 hover:text-white">
          <ArrowLeft size={16} />
          Back to site
        </a>
        <button
          type="button"
          onClick={() => {
            void signOut();
            window.location.hash = '';
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-aluminum-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-charcoal-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-white/5 bg-charcoal-900 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-charcoal-900/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-6 py-4 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="text-aluminum-300 transition-colors hover:text-white lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <h1 className="text-lg font-semibold text-white">{sectionTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && !syncing && (
                <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                  <Clock size={12} />
                  {pendingCount} pending
                </span>
              )}
              {syncing && (
                <span className="flex items-center gap-1.5 rounded-full bg-ice-500/10 px-3 py-1 text-xs font-semibold text-ice-300">
                  <Loader2 size={12} className="animate-spin" />
                  Syncing
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          {activeSection === 'overview' && (
            <>
              {renderBismillah()}
              {renderStatCards(statCards, dailyStatCards)}
              {renderStatusBar()}

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Inbox size={18} className="text-ice-300" />
                    <h3 className="text-sm font-semibold text-white">Total Enquiries</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{total}</p>
                  <p className="mt-1 text-xs text-aluminum-400">{newWorks.length} new today, {pendingWorks.length} pending from earlier dates</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase size={18} className="text-green-400" />
                    <h3 className="text-sm font-semibold text-white">Active Work</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{workSubmissions.length}</p>
                  <p className="mt-1 text-xs text-aluminum-400">{counts.accepted ?? 0} accepted, {counts.on_hold ?? 0} on hold, {counts.new ?? 0} new</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-aluminum-300" />
                    <h3 className="text-sm font-semibold text-white">Completed</h3>
                  </div>
                  <p className="text-3xl font-bold text-white">{counts.completed ?? 0}</p>
                  <p className="mt-1 text-xs text-aluminum-400">{counts.rejected ?? 0} rejected</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleNavClick('records')}
                  className="flex items-center gap-2 rounded-lg border border-ice-400/30 bg-ice-500/10 px-5 py-2.5 text-sm font-semibold text-ice-200 transition-colors hover:bg-ice-500/20 hover:text-white"
                >
                  <Inbox size={16} />
                  Go to All Records
                </button>
              </div>
            </>
          )}

          {activeSection === 'records' && (
            <>
              {renderBismillah()}
              {renderStatCards(statCards, dailyStatCards)}

              {deleteCandidate && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                  <div>
                    <p className="font-semibold text-red-100">Move &ldquo;{deleteCandidate.name}&rdquo; to the Recycle Bin?</p>
                    <p className="mt-1 text-sm text-red-200/80">It will be kept privately for 30 days and can be restored.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDeleteCandidate(null)} className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-aluminum-200 hover:text-white">Cancel</button>
                    <button type="button" onClick={() => void removeSubmission(deleteCandidate)} className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">Move to bin</button>
                  </div>
                </div>
              )}

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full rounded-lg border border-white/10 bg-charcoal-800 py-2.5 pl-11 pr-4 text-sm text-white placeholder-aluminum-400 transition-colors focus:border-ice-400 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Filter size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-charcoal-800 py-2.5 pl-11 pr-8 text-sm text-white transition-colors focus:border-ice-400 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <LayoutDashboard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-aluminum-500" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-charcoal-800 py-2.5 pl-11 pr-8 text-sm text-white transition-colors focus:border-ice-400 focus:outline-none"
                  >
                    <option value="all">All Project Types</option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-charcoal-800 px-4 py-2.5 text-sm font-medium text-aluminum-200 transition-colors hover:border-ice-400/40 hover:text-white"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={exportSubmissions}
                  className="flex items-center justify-center gap-2 rounded-lg border border-ice-400/30 bg-ice-500/10 px-4 py-2.5 text-sm font-medium text-ice-200 transition-colors hover:bg-ice-500/20 hover:text-white"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>

              {renderStatusBar()}

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-ice-400 border-t-transparent" />
                </div>
              ) : visibleSubmissions.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-charcoal-800/40 p-10 text-center text-aluminum-300">
                  No {statusFilter === 'all' ? 'active' : getStatusInfo(statusFilter).label.toLowerCase()} customer enquiries found.
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleSubmissions.map(renderSubmissionCard)}
                </div>
              )}
            </>
          )}

          {activeSection === 'work' && (
            <>
              <div className="mb-6 rounded-xl border border-ice-400/20 bg-ice-500/5 p-5">
                <div className="flex items-center gap-3">
                  <Briefcase size={20} className="text-ice-300" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Active Work Management</h2>
                    <p className="mt-1 text-sm text-aluminum-400">New, accepted, and on-hold enquiries requiring attention. Update statuses as work progresses.</p>
                  </div>
                </div>
              </div>

              {renderStatusBar()}

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-ice-400 border-t-transparent" />
                </div>
              ) : workSubmissions.length === 0 ? (
                <div className="rounded-xl border border-white/5 bg-charcoal-800/40 p-10 text-center text-aluminum-300">
                  No active work items. All enquiries are either completed or rejected.
                </div>
              ) : (
                <div className="space-y-4">
                  {workSubmissions.map(renderSubmissionCard)}
                </div>
              )}
            </>
          )}

          {activeSection === 'daily' && (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Daily Operations</h2>
                  <p className="mt-1 text-sm text-aluminum-400">View task records by date and manage your daily diary.</p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCalendar((prev) => !prev)}
                    className="dashboard-calendar-button flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-aluminum-100 transition-colors hover:border-ice-400/40 hover:text-white"
                  >
                    <CalendarDays size={17} />
                    {formatDateKey(selectedDate)}
                  </button>
                  {showCalendar && (
                    <div className="dashboard-calendar-popover absolute right-0 top-full z-30 mt-2 rounded-lg border border-white/10 bg-charcoal-800 p-3 shadow-2xl">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-aluminum-400" htmlFor="dashboard-date">
                        Select record date
                      </label>
                      <input
                        id="dashboard-date"
                        type="date"
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setFollowToday(event.target.value === getTodayKey());
                          setTaskView('all');
                          setStatusFilter('all');
                          setShowCalendar(false);
                        }}
                        className="rounded-md border border-white/10 bg-charcoal-900 px-3 py-2 text-sm text-white outline-none focus:border-ice-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="lg:col-span-2 rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Daily Task Records</h3>
                      <p className="mt-1 text-sm text-aluminum-400">{formatDateKey(selectedDate)} &middot; {selectedDayTasks.length} task(s)</p>
                    </div>
                    <span className="rounded-full bg-ice-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ice-300">Private diary</span>
                  </div>

                  {selectedDayTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/10 bg-charcoal-900/60 px-4 py-6 text-sm text-aluminum-400">
                      No tasks were received on this date.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedDayTasks.map((task) => {
                        const taskStatus = getStatusInfo(task.status);
                        const TaskIcon = taskStatus.icon;
                        return (
                          <div key={task.id} className="rounded-lg border border-white/5 bg-charcoal-900/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-white">{task.name}</p>
                                <p className="mt-1 text-xs text-aluminum-400">{task.project_type || 'Project not specified'}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${taskStatus.bgColor} ${taskStatus.color}`}>
                                <TaskIcon size={12} />
                                {taskStatus.label}
                              </span>
                            </div>
                            <p className="mt-3 whitespace-pre-line text-sm text-aluminum-200">{task.message || 'No progress details recorded.'}</p>
                            <p className="mt-2 text-[10px] uppercase tracking-wider text-aluminum-500">Received {formatDate(task.created_at)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeSection === 'tools' && (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Calculator & Export</h2>
                  <p className="mt-1 text-sm text-aluminum-400">Quick calculation tools and data export.</p>
                </div>
                <button
                  type="button"
                  onClick={exportSubmissions}
                  className="flex items-center justify-center gap-2 rounded-lg border border-ice-400/30 bg-ice-500/10 px-5 py-2.5 text-sm font-medium text-ice-200 transition-colors hover:bg-ice-500/20 hover:text-white"
                >
                  <Download size={16} />
                  Export CSV Backup
                </button>
              </div>

              <div className="rounded-xl border border-white/5 bg-charcoal-800/50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Calculator</h3>
                  <span className="rounded-full bg-ice-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ice-300">Private</span>
                </div>

                <div className="mx-auto max-w-md rounded-2xl border border-white/5 bg-charcoal-900 p-4 shadow-2xl shadow-charcoal-950/60">
                  <div className="mb-4 rounded-xl bg-charcoal-950/80 p-4 text-right">
                    <div className="min-h-[24px] text-xs text-aluminum-400">{calculatorExpression || '0'}</div>
                    <div className="mt-2 break-all text-3xl font-bold text-white">{calculatorDisplay}</div>
                  </div>

                  <div className="space-y-3">
                    {calculatorRows.map((row) => (
                      <div key={row.join('-')} className="grid grid-cols-4 gap-3">
                        {row.map((button) => {
                          const isEquals = button === '=';
                          const isOperator = ['/', '*', '+', '-'].includes(button);
                          const isWide = button === '0';
                          const isDanger = button === 'C' || button === 'DEL';

                          return (
                            <button
                              key={button}
                              type="button"
                              onClick={() => handleCalculatorInput(button)}
                              className={[
                                'rounded-xl border px-4 py-3 text-lg font-semibold transition-colors',
                                isWide ? 'col-span-2' : '',
                                isEquals ? 'border-ice-400/40 bg-ice-500 text-white' : '',
                                isOperator ? 'border-white/10 bg-charcoal-800 text-ice-200' : '',
                                isDanger ? 'border-red-500/20 bg-red-500/10 text-red-200' : '',
                                !isEquals && !isOperator && !isDanger ? 'border-white/10 bg-charcoal-800 text-white' : '',
                              ].join(' ')}
                            >
                              {button}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'recycle' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white">Recycle Bin</h2>
                <p className="mt-1 text-sm text-aluminum-400">Deleted records are available for 30 days before permanent removal.</p>
              </div>

              <div className="rounded-xl border border-red-400/20 bg-charcoal-800/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200">{recycleBin.length} record(s)</span>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void cleanupRecycleBin(7)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-aluminum-200 hover:border-ice-400/40 hover:text-white"
                  >
                    Clear 7-day old
                  </button>
                  <button
                    type="button"
                    onClick={() => void cleanupRecycleBin(15)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-aluminum-200 hover:border-ice-400/40 hover:text-white"
                  >
                    Clear 15-day old
                  </button>
                </div>

                {recycleBin.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-aluminum-400">Recycle Bin is empty.</p>
                ) : (
                  <div className="space-y-3">
                    {recycleBin.map((submission) => (
                      <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-charcoal-900/70 p-3">
                        <div>
                          <p className="font-semibold text-white">{submission.name}</p>
                          <p className="text-xs text-aluminum-400">Deleted {submission.deleted_at ? formatDate(submission.deleted_at) : 'recently'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => void restoreSubmission(submission)} className="rounded-md bg-green-500/15 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/25">Restore</button>
                          <button type="button" onClick={() => void permanentlyDeleteSubmission(submission)} className="rounded-md bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/25">Delete forever</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderStatusBar()}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
