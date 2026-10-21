import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TransactionModal from './components/TransactionModal';
import TransferModal from './components/TransferModal';
import TataAIBotWidget from './components/TataAIBotWidget';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DashboardOverview from './pages/DashboardOverview';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import BudgetsPage from './pages/BudgetsPage';
import WalletsPage from './pages/WalletsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import { apiFetch, getAuthToken, getCurrentUser, setAuthToken, setCurrentUser } from './utils/api';

export default function App() {
  const cachedInitialUser = getCurrentUser();
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register' | 'pending_approval' | 'dashboard'
  const [currentTab, setCurrentTab] = useState(() => {
    return cachedInitialUser?.role === 'admin' ? 'admin' : 'overview';
  });
  const [user, setUser] = useState(cachedInitialUser);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [telegramStatus, setTelegramStatus] = useState({ isConnected: false, botUsername: null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Refresh Triggers
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize Auth state
  useEffect(() => {
    const token = getAuthToken();
    const cachedUser = getCurrentUser();

    if (token && cachedUser) {
      setUser(cachedUser);
      if (cachedUser.approval_status === 'pending_approval' && cachedUser.role !== 'admin') {
        setView('pending_approval');
      } else {
        setView('dashboard');
        if (cachedUser.role === 'admin') {
          setCurrentTab('admin');
        }
      }
      refreshCommonData();

      // Background fresh sync from server
      apiFetch('/auth/me').then(res => {
        if (res.ok && res.data.success) {
          const freshUser = res.data.user;
          setCurrentUser(freshUser);
          setUser(freshUser);
          if (freshUser.approval_status === 'pending_approval' && freshUser.role !== 'admin') {
            setView('pending_approval');
          } else {
            setView('dashboard');
            if (freshUser.role === 'admin') {
              setCurrentTab('admin');
            }
          }
        }
      }).catch(console.error);
    } else {
      setView('landing');
    }
  }, []);

  const refreshCommonData = async () => {
    try {
      const [wRes, cRes, tgRes, sRes] = await Promise.all([
        apiFetch('/wallets'),
        apiFetch('/categories'),
        apiFetch('/telegram/status'),
        apiFetch('/reports/summary?period=monthly')
      ]);

      if (wRes.ok && wRes.data.success) setWallets(wRes.data.wallets);
      if (cRes.ok && cRes.data.success) setCategories(cRes.data.categories);
      if (tgRes.ok && tgRes.data.success) setTelegramStatus(tgRes.data);
      if (sRes.ok && sRes.data.success) setSummary(sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Global 3-second heartbeat polling: automatically updates balance across all tabs / devices / Telegram Bot
  useEffect(() => {
    const timer = setInterval(() => {
      if (getAuthToken()) {
        refreshCommonData();
      }
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Master Global Real-Time Synchronization Dispatcher (0ms instant local React state update)
  const notifyDataUpdated = (detail = null) => {
    // 1. If detail contains updated wallets, set them IMMEDIATELY (0ms instant re-render)
    if (detail?.wallets) {
      setWallets(detail.wallets);
    }
    // 2. Fetch fresh summaries and data in background
    refreshCommonData();
    setRefreshTrigger(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('tatadana:data_updated', { detail }));
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.approval_status === 'pending_approval' && userData.role !== 'admin') {
      setView('pending_approval');
    } else {
      setView('dashboard');
      if (userData.role === 'admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('overview');
      }
      refreshCommonData();
    }
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setView('pending_approval');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
    setView('landing');
  };

  const handleExitImpersonation = () => {
    // Re-login as original superadmin
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'fadhlan2146@gmail.com', password: 'Fadhlan2146' })
    }).then(res => {
      if (res.ok && res.data.success) {
        setAuthToken(res.data.token);
        setCurrentUser(res.data.user);
        setUser(res.data.user);
        setCurrentTab('admin');
        refreshCommonData();
      }
    });
  };

  // 1. PUBLIC LANDING VIEW
  if (view === 'landing') {
    return (
      <LandingPage
        onNavigateLogin={() => setView('login')}
        onNavigateRegister={() => setView('register')}
      />
    );
  }

  // 2. LOGIN VIEW
  if (view === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateRegister={() => setView('register')}
        onNavigateLanding={() => setView('landing')}
      />
    );
  }

  // 3. REGISTER VIEW
  if (view === 'register') {
    return (
      <RegisterPage
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateLogin={() => setView('login')}
        onNavigateLanding={() => setView('landing')}
      />
    );
  }

  // 4. PENDING APPROVAL VIEW (ADMIN VERIFICATION HOLD)
  if (view === 'pending_approval') {
    return (
      <PendingApprovalPage
        onApproved={() => {
          setView('dashboard');
          refreshCommonData();
        }}
        onLogout={handleLogout}
      />
    );
  }

  // 5. MAIN AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentTab={currentTab}
          setTab={setCurrentTab}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 w-64 bg-white h-full shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              setTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenNewTransaction={() => setIsTxModalOpen(true)}
          telegramStatus={telegramStatus}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onExitImpersonation={handleExitImpersonation}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'overview' && (
            <DashboardOverview
              onOpenNewTransaction={() => setIsTxModalOpen(true)}
              onNavigateTab={setCurrentTab}
              wallets={wallets}
              summary={summary}
              refreshTrigger={refreshTrigger}
              onDataUpdated={notifyDataUpdated}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenNewTransaction={() => setIsTxModalOpen(true)}
              wallets={wallets}
              categories={categories}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage onNavigateTab={setCurrentTab} />
          )}

          {currentTab === 'budgets' && (
            <BudgetsPage categories={categories} />
          )}

          {currentTab === 'wallets' && (
            <WalletsPage
              wallets={wallets}
              onRefreshWallets={notifyDataUpdated}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              categories={categories}
              onRefreshCategories={notifyDataUpdated}
              onRefreshTelegramStatus={refreshCommonData}
            />
          )}

          {currentTab === 'admin' && (
            <AdminDashboard
              onImpersonateUser={() => {
                setUser(getCurrentUser());
                setCurrentTab('overview');
                notifyDataUpdated();
              }}
            />
          )}
        </main>
      </div>

      {/* In-App Tata AI Chatbot Floating Widget with Direct Balance Sync */}
      <TataAIBotWidget onTransactionRecorded={notifyDataUpdated} />

      {/* Global Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={notifyDataUpdated}
        wallets={wallets}
        categories={categories}
      />

      {/* Global Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={notifyDataUpdated}
        wallets={wallets}
      />
    </div>
  );
}
