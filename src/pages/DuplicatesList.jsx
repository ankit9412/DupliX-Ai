import React, { useEffect, useState } from 'react';
import { File, Trash2, ShieldCheck, ExternalLink } from 'lucide-react';

export default function DuplicatesList({ scanId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanId && window.electronAPI) {
      setLoading(true);
      window.electronAPI.getDuplicates(scanId).then(dups => {
        // Group by duplicateGroupId
        const grouped = dups.reduce((acc, file) => {
          if (!acc[file.duplicateGroupId]) {
            acc[file.duplicateGroupId] = [];
          }
          acc[file.duplicateGroupId].push(file);
          return acc;
        }, {});
        
        // Convert to array and sort by size descending
        const groupsArray = Object.entries(grouped)
          .map(([hash, files]) => ({
             hash,
             files,
             size: files[0].size,
             wastedSpace: files[0].size * (files.length - 1)
          }))
          .sort((a, b) => b.wastedSpace - a.wastedSpace);
          
        setGroups(groupsArray);
        setLoading(false);
      });
    }
  }, [scanId]);

  const handleOpenFile = (filePath) => {
    if (window.electronAPI) {
      window.electronAPI.openFile(filePath);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!scanId) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Run a scan first to view duplicates.
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-slate-400">Loading duplicates...</div>;
  }

  const totalWasted = groups.reduce((acc, g) => acc + g.wastedSpace, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">Exact Duplicates</h2>
          <p className="text-slate-400 mt-1">Select the copies you want to remove.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Recoverable Space</p>
          <p className="text-2xl font-bold text-rose-400">{formatSize(totalWasted)}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition">
          Auto-Select Oldest
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition">
          Auto-Select Newest
        </button>
        <button className="ml-auto px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-rose-900/20">
          <Trash2 size={16} />
          Clean Selected
        </button>
      </div>

      <div className="space-y-6">
        {groups.map((group, index) => (
          <div key={group.hash} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">Group {index + 1}</span>
                <span className="text-sm font-mono text-slate-500 truncate w-32" title={group.hash}>{group.hash}</span>
              </div>
              <div className="text-sm font-medium text-rose-400">
                {group.files.length} files • Wasting {formatSize(group.wastedSpace)}
              </div>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {group.files.map((file, i) => (
                <div key={file.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
                  <File size={20} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 group relative">
                    <p className="text-slate-200 font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
                       <span className="truncate">{file.path}</span>
                       <button onClick={() => handleOpenFile(file.path)} className="hidden group-hover:flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-slate-800 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                         <ExternalLink size={12} /> Open
                       </button>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-sm text-slate-400">
                    <p>{new Date(file.modifiedDate).toLocaleDateString()}</p>
                    <p className="text-xs mt-0.5">{formatSize(file.size)}</p>
                  </div>
                  {i === 0 && (
                    <div className="flex-shrink-0 w-24 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                        <ShieldCheck size={14} /> Keep
                      </span>
                    </div>
                  )}
                  {i !== 0 && (
                    <div className="flex-shrink-0 w-24 text-right">
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
            <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-xl font-medium text-slate-300">No Duplicates Found!</h3>
            <p className="text-slate-500 mt-2">Your storage is clean and optimized.</p>
          </div>
        )}
      </div>
    </div>
  );
}
