import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileBarChart,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { createInvestment, getErrorMessage, getInvestments, getInvestors, login, logout } from './api';
import type { AccessTokenClaims, InvestmentRequest, InvestmentStatus, Investor } from './types';

type Page = 'overview' | 'investments' | 'review';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatMoney(amount: number) {
  return currency.format(Number(amount) || 0);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const ACCESS_TOKEN_KEY = 'investment_access_token';

function getTokenClaims(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded, (character) =>
        `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
      ).join(''),
    );
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

function getSavedToken(): string {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return '';
  const claims = getTokenClaims(token);
  if (!claims || (claims.exp && claims.exp * 1000 <= Date.now())) {
    logout();
    return '';
  }
  return token;
}

function displayName(claims: AccessTokenClaims | null): string {
  if (!claims) return 'Account';
  const fullName = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ');
  return fullName || claims.preferred_username || 'Account';
}

function investorName(investors: Investor[], investorId: string) {
  return investors.find((investor) => investor.id === investorId)?.name ?? 'Investor';
}

function statusLabel(status: InvestmentStatus) {
  const labels: Record<InvestmentStatus, string> = {
    DRAFT: 'Draft',
    IN_PROGRESS: 'In review',
    PENDING_APPROVAL: 'Awaiting approval',
    APPROVED: 'Approved',
    REJECTED: 'Declined',
    COMPLETED: 'Completed',
  };
  return labels[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

function StatusPill({ status }: { status: InvestmentStatus }) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {statusLabel(status)}
    </span>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
  reviewCount,
  userName,
  userRole,
  apiConnected,
  onLogout,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onClose: () => void;
  reviewCount: number;
  userName: string;
  userRole: string;
  apiConnected: boolean;
  onLogout: () => void;
}) {
  const items: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { page: 'overview', label: 'Overview', icon: LayoutDashboard },
    { page: 'investments', label: 'Investments', icon: BriefcaseBusiness },
    { page: 'review', label: 'Review queue', icon: ShieldCheck },
  ];

  return (
    <>
      {mobileOpen && <button className="mobile-scrim" onClick={onClose} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <BrandMark />
          <span className="brand-name">northstar<span>.</span></span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="workspace-switcher">
          <span className="workspace-avatar"><BriefcaseBusiness size={15} /></span>
          <span className="workspace-copy">
            <strong>Investment workspace</strong>
            <small>{apiConnected ? 'Connected to your API' : 'Connecting to your API'}</small>
          </span>
          <span className={`connection-dot ${apiConnected ? 'connection-online' : ''}`} title={apiConnected ? 'API connected' : 'Connecting to API'} />
        </div>

        <div className="nav-section-label">Workspace</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {items.map(({ page, label, icon: Icon }) => (
            <button
              className={`nav-item ${activePage === page ? 'nav-item-active' : ''}`}
              key={page}
              onClick={() => {
                onNavigate(page);
                onClose();
              }}
              aria-current={activePage === page ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {page === 'review' && reviewCount > 0 && <span className="nav-count">{reviewCount}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <div className="help-icon"><CircleHelp size={17} /></div>
          <div>
            <strong>Need a hand?</strong>
            <span>Visit the help center</span>
          </div>
          <ArrowRight size={15} className="help-arrow" />
        </div>
        <div className="profile-button">
          <span className="profile-avatar">{initials(userName)}</span>
          <span className="profile-copy"><strong>{userName}</strong><small>{userRole}</small></span>
          <button type="button" className="logout-button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  activePage,
  onMenu,
  onCreate,
  searchValue,
  onSearchChange,
  onNotify,
  userName,
}: {
  activePage: Page;
  onMenu: () => void;
  onCreate: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNotify: () => void;
  userName: string;
}) {
  const titles: Record<Page, { eyebrow: string; title: string }> = {
    overview: {
      eyebrow: new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()).toUpperCase(),
      title: `Welcome, ${userName.split(/\s+/)[0]}`,
    },
    investments: { eyebrow: 'YOUR PORTFOLIO', title: 'Investment requests' },
    review: { eyebrow: 'WORKFLOW', title: 'Review queue' },
  };
  const heading = titles[activePage];

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="page-heading">
        <span className="eyebrow">{heading.eyebrow}</span>
        <h1>{heading.title}</h1>
      </div>
      <div className="topbar-actions">
        <label className="command-search"><Search size={16} /><input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search investments..." aria-label="Search investments" /></label>
        <button className="icon-button notification-button" onClick={onNotify} aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="button button-primary topbar-cta" onClick={onCreate}>
          <Plus size={17} strokeWidth={2.2} /> <span>New investment</span>
        </button>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Wallet;
  tone: string;
}) {
  const Icon = icon;
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${tone}`}><Icon size={17} strokeWidth={1.8} /></span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function ActivityChart({ requests }: { requests: InvestmentRequest[] }) {
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const total = requests.reduce((sum, request) => {
        const created = new Date(request.createdAt);
        return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth()
          ? sum + Number(request.amount || 0)
          : sum;
      }, 0);
      return {
        key,
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        total,
      };
    });
  }, [requests]);
  const hasData = months.some((month) => month.total > 0);
  const max = hasData ? Math.max(...months.map((month) => month.total)) : 0;

  return (
    <div className="chart-wrap">
      <div className="chart-y-labels" aria-hidden="true">
        {hasData ? (
          <><span>{formatMoney(max)}</span><span>{formatMoney(max * 0.66)}</span><span>{formatMoney(max * 0.33)}</span><span>$0</span></>
        ) : (
          <><span>$0</span><span>$0</span><span>$0</span><span>$0</span></>
        )}
      </div>
      <div className="chart-content">
        <div className="chart-grid" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="chart-bars">
          {months.map((month, index) => (
            <div className="chart-column" key={month.key}>
              <div className="bar-track">
                <div
                  className={`chart-bar ${index === months.length - 1 ? 'chart-bar-current' : ''}`}
                  style={{ height: `${hasData ? Math.max((month.total / max) * 100, month.total ? 5 : 0) : 0}%` }}
                  title={`${month.label}: ${formatMoney(month.total)}`}
                />
              </div>
              <span className="chart-month">{month.label}</span>
            </div>
          ))}
        </div>
      </div>
      {!hasData && <div className="chart-empty">Investment activity will appear here</div>}
    </div>
  );
}

function RecentInvestments({
  requests,
  investors,
  onViewAll,
}: {
  requests: InvestmentRequest[];
  investors: Investor[];
  onViewAll: () => void;
}) {
  const recent = requests.slice(0, 5);
  return (
    <section className="panel recent-panel">
      <div className="panel-heading">
        <div><h2>Recent investments</h2><p>Your latest activity across the portfolio</p></div>
        <button className="text-button" onClick={onViewAll}>View all <ArrowRight size={15} /></button>
      </div>
      {recent.length === 0 ? (
        <div className="table-empty">
          <span className="empty-icon"><BriefcaseBusiness size={19} /></span>
          <strong>Your next big move starts here</strong>
          <span>When you create an investment, it will show up here.</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="investment-table">
            <thead><tr><th>Company</th><th>Investor</th><th>Amount</th><th>Status</th><th>Created</th><th /></tr></thead>
            <tbody>
              {recent.map((request) => (
                <tr key={request.id}>
                  <td><span className="company-cell"><span className="company-avatar">{initials(request.companyName)}</span><strong>{request.companyName}</strong></span></td>
                  <td className="muted-cell">{investorName(investors, request.investorId)}</td>
                  <td className="amount-cell">{formatMoney(request.amount)}</td>
                  <td><StatusPill status={request.status} /></td>
                  <td className="muted-cell date-cell">{formatDate(request.createdAt)}</td>
                  <td><span className="row-action" aria-hidden="true"><ArrowRight size={15} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Dashboard({
  requests,
  investors,
  onViewAll,
  onCreate,
}: {
  requests: InvestmentRequest[];
  investors: Investor[];
  onViewAll: () => void;
  onCreate: () => void;
}) {
  const activeRequests = requests.filter((request) =>
    ['IN_PROGRESS', 'PENDING_APPROVAL'].includes(request.status),
  );
  const approved = requests.filter((request) =>
    ['APPROVED', 'COMPLETED'].includes(request.status),
  );
  const deployed = approved.reduce((sum, request) => sum + Number(request.amount || 0), 0);
  const pipeline = activeRequests.reduce((sum, request) => sum + Number(request.amount || 0), 0);

  return (
    <>
      <section className="welcome-strip">
        <div className="welcome-copy">
          <span className="welcome-kicker"><Sparkles size={14} /> YOUR CAPITAL, IN GOOD COMPANY</span>
          <h2>Clarity for every<br /><em>investment decision.</em></h2>
          <p>See what’s moving, what needs attention, and where your next opportunity is.</p>
          <button className="button button-light" onClick={onCreate}>Create an investment <ArrowRight size={16} /></button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="art-core"><BrandMark /></div>
          <div className="art-node art-node-one"><ArrowUpRight size={17} /></div>
          <div className="art-node art-node-two"><Check size={15} /></div>
          <div className="art-caption"><span /> A clearer view of what’s next</div>
        </div>
        <div className="welcome-index">01 <span>/ 03</span></div>
      </section>

      <section className="metrics-grid" aria-label="Portfolio summary">
        <MetricCard label="Total portfolio" value={formatMoney(deployed)} note={`${approved.length} approved investments`} icon={Wallet} tone="metric-mint" />
        <MetricCard label="In the pipeline" value={formatMoney(pipeline)} note={`${activeRequests.length} awaiting a decision`} icon={Clock3} tone="metric-lilac" />
        <MetricCard label="Total opportunities" value={String(requests.length).padStart(2, '0')} note="Across your portfolio" icon={BriefcaseBusiness} tone="metric-peach" />
        <MetricCard label="Approval rate" value={requests.length ? `${Math.round((approved.length / requests.length) * 100)}%` : '—'} note="Approved or completed requests" icon={ShieldCheck} tone="metric-blue" />
      </section>

      <section className="insights-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div><h2>Portfolio activity</h2><p>Investment volume over the last six months</p></div>
            <span className="period-select"><CalendarDays size={14} /> Last 6 months</span>
          </div>
          <ActivityChart requests={requests} />
          <div className="chart-legend"><span className="legend-dot" /> Investment volume <span className="chart-footnote">Based on request date</span></div>
        </article>
        <article className="pipeline-card">
          <div className="pipeline-top"><span>YOUR PIPELINE</span><span className="pipeline-icon"><FileBarChart size={17} /></span></div>
          <div className="pipeline-value">{formatMoney(pipeline)}</div>
          <p>Currently moving through review</p>
          <div className="pipeline-rule" />
          <div className="pipeline-bottom">
            <span><span className="pipeline-status-dot" /> {activeRequests.length} active {activeRequests.length === 1 ? 'request' : 'requests'}</span>
            <button onClick={onViewAll}>Explore <ArrowRight size={14} /></button>
          </div>
          <div className="pipeline-watermark"><BriefcaseBusiness size={100} strokeWidth={0.8} /></div>
        </article>
      </section>

      <RecentInvestments requests={requests} investors={investors} onViewAll={onViewAll} />
    </>
  );
}

function InvestmentList({
  requests,
  investors,
  onCreate,
  initialFilter,
  initialQuery,
}: {
  requests: InvestmentRequest[];
  investors: Investor[];
  onCreate: () => void;
  initialFilter: 'all' | 'review';
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => setFilter(initialFilter), [initialFilter]);
  useEffect(() => setQuery(initialQuery), [initialQuery]);

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesSearch = `${request.companyName} ${investorName(investors, request.investorId)}`
      .toLowerCase()
      .includes(query.toLowerCase().trim());
    const matchesStatus = filter === 'all' || ['IN_PROGRESS', 'PENDING_APPROVAL'].includes(request.status);
    return matchesSearch && matchesStatus;
  }), [filter, investors, query, requests]);

  return (
    <section className="panel list-panel">
      <div className="list-toolbar">
        <div><h2>All investments <span className="count-chip">{filteredRequests.length}</span></h2><p>Manage and track every request in your portfolio.</p></div>
        <button className="button button-primary" onClick={onCreate}><Plus size={16} /> New investment</button>
      </div>
      <div className="filter-toolbar">
        <label className="list-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies or investors" /></label>
        <div className="filter-control">
          <Filter size={15} />
          <select value={filter} onChange={(event) => setFilter(event.target.value as 'all' | 'review')} aria-label="Filter investments">
            <option value="all">All investments</option>
            <option value="review">In review</option>
          </select>
          <ChevronDown size={14} />
        </div>
      </div>
      {filteredRequests.length === 0 ? (
        <div className="table-empty">
          <span className="empty-icon"><Search size={18} /></span>
          <strong>{requests.length ? 'No matching investments' : 'Your portfolio is ready for its first investment'}</strong>
          <span>{requests.length ? 'Try another search or update your filters.' : 'Create a request to start your approval workflow.'}</span>
          {!requests.length && <button className="button button-primary empty-cta" onClick={onCreate}><Plus size={15} /> Create investment</button>}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="investment-table full-table">
            <thead><tr><th>Company</th><th>Investor</th><th>Amount</th><th>Risk</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>{filteredRequests.map((request) => (
              <tr key={request.id}>
                <td><span className="company-cell"><span className="company-avatar">{initials(request.companyName)}</span><strong>{request.companyName}</strong></span></td>
                <td className="muted-cell">{investorName(investors, request.investorId)}</td>
                <td className="amount-cell">{formatMoney(request.amount)}</td>
                <td><span className={`risk-level risk-${request.riskLevel?.toLowerCase() ?? 'none'}`}>{request.riskLevel ? request.riskLevel.toLowerCase() : 'Not assessed'}</span></td>
                <td><StatusPill status={request.status} /></td>
                <td className="muted-cell date-cell">{formatDate(request.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <div className="list-footer"><span>Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> investments</span><span>Sorted by newest first</span></div>
    </section>
  );
}

function CreateInvestmentModal({
  investors,
  investorsError,
  defaultInvestorId,
  onClose,
  onCreated,
}: {
  investors: Investor[];
  investorsError: string | null;
  defaultInvestorId: string;
  onClose: () => void;
  onCreated: (input: { investorId: string; companyName: string; amount: number; ruleName: string }) => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState('');
  const [investorId, setInvestorId] = useState(defaultInvestorId);
  const [amount, setAmount] = useState('');
  const [ruleName, setRuleName] = useState('investment-approval');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!investorId) {
      setError('Choose an investor before submitting this request.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an investment amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onCreated({ investorId, companyName: companyName.trim(), amount: numericAmount, ruleName: ruleName.trim() });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  return (
    <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="request-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <span className="modal-icon"><BriefcaseBusiness size={18} /></span>
          <button className="icon-button modal-close" onClick={onClose} disabled={saving} aria-label="Close dialog"><X size={18} /></button>
          <span className="eyebrow">A NEW OPPORTUNITY</span>
          <h2 id="modal-title">Create an investment</h2>
          <p>Start a request and send it into your approval workflow.</p>
        </div>
        <form className="request-form" onSubmit={submit}>
          <label className="field-label">Company name
            <input autoFocus required maxLength={255} value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Meridian Technologies" />
          </label>
          <label className="field-label">Investor
            <select required value={investorId} onChange={(event) => setInvestorId(event.target.value)} disabled={investors.length === 0}>
              <option value="" disabled>Select an investor</option>
              {investors.map((investor) => <option key={investor.id} value={investor.id}>{investor.name}</option>)}
            </select>
          </label>
          {investorsError && <div className="inline-warning">{investorsError}</div>}
          {!investorsError && investors.length === 0 && <div className="inline-warning">No investor accounts are available. Add a user before creating an investment.</div>}
          <div className="form-row">
            <label className="field-label">Investment amount
              <span className="amount-input"><span>$</span><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></span>
            </label>
            <label className="field-label">Approval rule
              <input required value={ruleName} onChange={(event) => setRuleName(event.target.value)} />
            </label>
          </div>
          <div className="workflow-note"><ShieldCheck size={17} /><span><strong>Approval workflow included</strong><small>Your request will be routed for review as soon as it’s submitted.</small></span></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="button button-quiet" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving || investors.length === 0}>
              {saving ? <><LoaderCircle size={16} className="spin" /> Submitting…</> : <>Submit request <ArrowRight size={16} /></>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand"><BrandMark /><span className="brand-name">northstar<span>.</span></span></div>
        <div className="login-icon"><ShieldCheck size={21} /></div>
        <span className="eyebrow">YOUR INVESTMENT WORKSPACE</span>
        <h1>Welcome back</h1>
        <p>Sign in with your account to view your investment workspace.</p>
        <form className="login-form" onSubmit={submit}>
          <label className="field-label">Username
            <input autoComplete="username" autoFocus required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" />
          </label>
          <label className="field-label">Password
            <input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary login-submit" type="submit" disabled={submitting}>
            {submitting ? <><LoaderCircle size={16} className="spin" /> Connecting…</> : <>Sign in securely <ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="login-security"><ShieldCheck size={14} /> Authentication is handled by your configured identity provider.</div>
      </section>
      <footer className="login-footer">Northstar Investment Workspace <span>·</span> Private &amp; secure</footer>
    </main>
  );
}

function LoadingState() {
  return <div className="loading-state"><LoaderCircle size={23} className="spin" /><span>Getting your portfolio ready…</span></div>;
}

export default function App() {
  const [accessToken, setAccessToken] = useState(getSavedToken);
  const [activePage, setActivePage] = useState<Page>('overview');
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [investorsError, setInvestorsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const tokenClaims = useMemo(() => accessToken ? getTokenClaims(accessToken) : null, [accessToken]);
  const userName = displayName(tokenClaims);
  const currentUser = investors.find((investor) => investor.keycloakId === tokenClaims?.sub);
  const userRole = currentUser?.role || 'Signed in';

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const [requestsResult, investorsResult] = await Promise.allSettled([getInvestments(), getInvestors()]);
    if (requestsResult.status === 'fulfilled') {
      setRequests(requestsResult.value);
      setRequestsError(null);
    } else {
      setRequestsError(getErrorMessage(requestsResult.reason));
    }
    if (investorsResult.status === 'fulfilled') {
      setInvestors(investorsResult.value);
      setInvestorsError(null);
    } else {
      setInvestorsError(getErrorMessage(investorsResult.reason));
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      void loadData();
    } else {
      setRequests([]);
      setInvestors([]);
      setLoading(false);
    }
  }, [accessToken, loadData]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const pageForTitle: Record<Page, string> = {
    overview: 'Investment workspace',
    investments: 'Investments',
    review: 'Review queue',
  };
  const screenTitle = pageForTitle[activePage];
  const reviewCount = requests.filter((request) =>
    ['IN_PROGRESS', 'PENDING_APPROVAL'].includes(request.status),
  ).length;

  function updateSearch(value: string) {
    setSearchValue(value);
    setActivePage('investments');
  }

  async function submitInvestment(input: {
    investorId: string;
    companyName: string;
    amount: number;
    ruleName: string;
  }) {
    await createInvestment(input);
    setModalOpen(false);
    setToast('Your investment request has been submitted.');
    await loadData();
  }

  async function signIn(username: string, password: string) {
    const response = await login(username, password);
    const claims = getTokenClaims(response.access_token);
    if (!claims || (claims.exp && claims.exp * 1000 <= Date.now())) {
      throw new Error('The identity provider returned an invalid or expired access token.');
    }
    sessionStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
    setAccessToken(response.access_token);
    setRequestsError(null);
    setInvestorsError(null);
  }

  function signOut() {
    logout();
    setAccessToken('');
    setActivePage('overview');
    setRequestsError(null);
    setInvestorsError(null);
  }

  if (!accessToken) {
    return <LoginPage onLogin={signIn} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        reviewCount={reviewCount}
        userName={currentUser?.name || userName}
        userRole={userRole}
        apiConnected={!loading && !requestsError}
        onLogout={signOut}
      />
      <main className="main-shell">
        <Topbar
          activePage={activePage}
          onMenu={() => setMobileOpen(true)}
          onCreate={() => setModalOpen(true)}
          searchValue={searchValue}
          onSearchChange={updateSearch}
          onNotify={() => setToast('Notifications are not connected to this workspace yet.')}
          userName={currentUser?.name || userName}
        />
        <div className="page-content">
          {requestsError && (
            <div className="error-banner" role="alert">
              <span>{requestsError}</span>
              <button onClick={() => void loadData()}><ArrowRight size={14} /> Retry</button>
            </div>
          )}
          {investorsError && !requestsError && (
            <div className="info-banner"><span>Investor information could not be loaded. You can still browse your portfolio.</span><button onClick={() => void loadData()}>Retry</button></div>
          )}
          {loading ? <LoadingState /> : requestsError ? (
            <div className="error-placeholder"><span className="error-icon"><BriefcaseBusiness size={21} /></span><h2>We couldn’t load your portfolio</h2><p>Check your API connection and try again.</p><button className="button button-primary" onClick={() => void loadData()}>Try again <ArrowRight size={15} /></button></div>
          ) : activePage === 'overview' ? (
            <Dashboard requests={requests} investors={investors} onViewAll={() => setActivePage('investments')} onCreate={() => setModalOpen(true)} />
          ) : (
            <InvestmentList requests={requests} investors={investors} onCreate={() => setModalOpen(true)} initialFilter={activePage === 'review' ? 'review' : 'all'} initialQuery={searchValue} />
          )}
          <footer className="page-footer"><span><BrandMark /> Northstar Investment Workspace</span><span>Private & secure <span className="footer-dot">•</span> Built for better decisions</span></footer>
        </div>
      </main>
      {modalOpen && <CreateInvestmentModal investors={investors} investorsError={investorsError} defaultInvestorId={currentUser?.id ?? ''} onClose={() => setModalOpen(false)} onCreated={submitInvestment} />}
      {toast && <div className="toast" role="status"><span><Check size={16} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={16} /></button></div>}
      <span className="sr-only">{screenTitle}</span>
    </div>
  );
}
