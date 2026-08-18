import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Lock, Unlock, CheckCircle, XCircle, DollarSign, Activity, RefreshCw, HardHat, UserCheck, Search, AlertTriangle, ArrowLeft } from 'lucide-react';

export const AdminDashboard = ({ onBackToSite }) => {
  const [stats, setStats] = useState({
    grossVolume: 0,
    totalCommission: 0,
    pendingDues: 0,
    totalWorkers: 0,
    verifiedWorkers: 0,
    totalClients: 0
  });

  const [users, setUsers] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [activeTab, setActiveTab] = useState('USERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetch('http://localhost:5050/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

      const usersRes = await fetch('http://localhost:5050/api/admin/users');
      const usersData = await usersRes.json();
      if (usersRes.ok) setUsers(usersData.users || []);

      const kycRes = await fetch('http://localhost:5050/api/admin/kyc/pending');
      const kycData = await kycRes.json();
      if (kycRes.ok) setKycQueue(kycData.queue || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleLock = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/users/${userId}/toggle-lock`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(data.message || 'Account lock status updated.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to update account lock state.');
    }
  };

  const handleApproveKyc = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/kyc/${workerId}/approve`, { method: 'POST' });
      const data = await res.json();
      setActionMessage(data.message || 'KYC Approved successfully.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to approve KYC.');
    }
  };

  const handleRejectKyc = async (workerId) => {
    try {
      const res = await fetch(`http://localhost:5050/api/admin/kyc/${workerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Aadhaar ID image not clear' })
      });
      const data = await res.json();
      setActionMessage(data.message || 'KYC Rejected.');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('Failed to reject KYC.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] p-4 sm:p-8">
      
      {/* Top Admin Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>KAAM Platform Central Admin</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white mt-1">Master User Control Panel</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control Client and Worker accounts, lock/unlock users, and approve Aadhaar KYC badges.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Worker Site</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="max-w-7xl mx-auto my-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Overview Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Clients</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white font-['Outfit']">{stats.totalClients || users.filter(u=>u.role==='CLIENT').length}</p>
          <p className="text-[11px] text-slate-400">Registered Homeowners</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Workers</span>
            <HardHat className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-['Outfit']">{stats.totalWorkers || users.filter(u=>u.role==='WORKER').length}</p>
          <p className="text-[11px] text-amber-300/80 font-bold">{stats.verifiedWorkers} Verified KYC Badges</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Bookings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-['Outfit']">₹{stats.grossVolume || 0}</p>
          <p className="text-[11px] text-slate-400">Platform Job Volume</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Commission Dues</span>
            <Activity className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-black text-pink-400 font-['Outfit']">₹{stats.totalCommission || 0}</p>
          <p className="text-[11px] text-slate-400">10% Platform Dues</p>
        </div>
      </div>

      {/* Main Control Panel Card */}
      <div className="max-w-7xl mx-auto bg-slate-800/60 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Navigation Tabs & Search Bar */}
        <div className="p-4 sm:p-6 bg-slate-800/90 border-b border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'USERS' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts Directory ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('KYC')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'KYC' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>KYC Approvals Queue ({kycQueue.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
            <input
              type="text"
              placeholder="Search user name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* TAB 1: USERS CONTROL DIRECTORY TABLE */}
        {activeTab === 'USERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Role & Trade</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">KYC Status</th>
                  <th className="px-6 py-4">Account Lock State</th>
                  <th className="px-6 py-4 text-right">Admin Control Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            user.role === 'WORKER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>
                            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{user.full_name}</p>
                            <p className="text-[10px] font-mono text-slate-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.role === 'WORKER' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        }`}>
                          {user.role}
                        </span>
                        {user.trade_title && (
                          <p className="text-xs text-slate-400 font-medium mt-1">{user.trade_title} • ₹{user.daily_rate}/day</p>
                        )}
                      </td>

                      <td className="px-6 py-4 space-y-0.5">
                        <p className="font-medium text-slate-200">{user.email || 'No email'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{user.phone}</p>
                        <p className="text-[11px] text-slate-500">{user.locality || 'Noida'}</p>
                      </td>

                      <td className="px-6 py-4">
                        {user.role === 'WORKER' ? (
                          user.kyc_status === 'VERIFIED' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> VERIFIED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> PENDING
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.is_account_locked ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> LOCKED (Dues Overdue)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Unlock className="w-3 h-3" /> ACTIVE / UNLOCKED
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleLock(user.id)}
                          className={`px-3 py-1.5 rounded-full font-bold text-[11px] transition-all flex items-center gap-1 inline-flex ${
                            user.is_account_locked
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-red-600/80 hover:bg-red-600 text-white'
                          }`}
                        >
                          {user.is_account_locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{user.is_account_locked ? 'Unlock' : 'Lock Account'}</span>
                        </button>

                        {user.role === 'WORKER' && user.kyc_status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleApproveKyc(user.worker_profile_id || user.id)}
                            className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify KYC</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: KYC APPROVALS QUEUE */}
        {activeTab === 'KYC' && (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">Pending Aadhaar & Bank KYC Applications</h3>
            {kycQueue.length === 0 ? (
              <div className="p-8 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-center text-slate-400 text-xs">
                No pending worker KYC submissions right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kycQueue.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-base">{item.worker_name}</p>
                        <p className="text-xs text-amber-400 font-semibold">{item.trade_title}</p>
                        <p className="text-xs text-slate-400">{item.worker_phone}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                        {item.kyc_status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl text-xs space-y-1 text-slate-300">
                      <p><strong className="text-slate-400">Aadhaar No:</strong> {item.govt_id_number}</p>
                      <p><strong className="text-slate-400">Bank:</strong> {item.bank_name} ({item.account_number})</p>
                      <p><strong className="text-slate-400">UPI Payout ID:</strong> <span className="font-mono text-purple-300">{item.upi_id}</span></p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApproveKyc(item.worker_id)}
                        className="flex-1 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve KYC
                      </button>
                      <button
                        onClick={() => handleRejectKyc(item.worker_id)}
                        className="flex-1 py-2 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
