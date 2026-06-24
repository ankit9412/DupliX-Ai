import React from 'react';
import { HardDrive, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard({ scanState, onTabChange }) {
  const getProgressPercentage = () => {
    if (scanState.total === 0) return 0;
    return Math.round((scanState.scanned / scanState.total) * 100);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-white tracking-tight">Storage Dashboard</h2>
        <p className="text-slate-400 mt-1">Overview of your local storage and scan health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <HardDrive size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Files Discovered</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {scanState.totalDiscovered > 0 ? scanState.totalDiscovered.toLocaleString() : '--'}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Search size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Files Hashed</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {scanState.status === 'completed' ? scanState.total : scanState.scanned.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm cursor-pointer hover:bg-slate-800/80 transition" onClick={() => onTabChange('duplicates')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Duplicates Found</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">
                {scanState.status === 'completed' ? 'View Results →' : '--'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {scanState.status === 'scanning' && (
        <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-6 shadow-xl shadow-blue-900/10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                Active Scan in Progress
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Phase: <span className="capitalize text-slate-300 font-medium">{scanState.stage}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{getProgressPercentage()}%</p>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 font-mono text-right">
            {scanState.scanned.toLocaleString()} / {scanState.total.toLocaleString()}
          </p>
        </div>
      )}

      {scanState.status === 'completed' && (
        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-2xl p-6 flex items-center gap-4">
           <CheckCircle2 className="text-emerald-500" size={32} />
           <div>
             <h3 className="text-lg font-semibold text-emerald-400">Scan Completed Successfully</h3>
             <p className="text-sm text-slate-400 mt-1">The engine has successfully identified exact duplicates using size-based pre-filtering and SHA-256 hashing.</p>
           </div>
           <button 
             onClick={() => onTabChange('duplicates')}
             className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
           >
             Review Duplicates
           </button>
        </div>
      )}
      
      {scanState.status === 'idle' && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl text-center">
          <Search size={48} className="text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-300">Ready to Scan</h3>
          <p className="text-slate-500 max-w-sm mt-2">Click "New Scan" in the sidebar to select drives or folders to analyze for duplicates.</p>
        </div>
      )}
    </div>
  );
}
