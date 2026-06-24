import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Trash2, Layers, ExternalLink } from 'lucide-react';

export default function SimilarImages({ scanId }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (scanId && window.electronAPI) {
      setLoading(true);
      window.electronAPI.getSimilarImages(scanId).then(data => {
        // Sort groups by wasted space descending
        data.sort((a, b) => b.wastedSpace - a.wastedSpace);
        setGroups(data);
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
        Run a scan first to view similar images.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        Calculating Hamming distances and grouping images...
      </div>
    );
  }

  const totalWasted = groups.reduce((acc, g) => acc + g.wastedSpace, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
            <ImageIcon className="text-blue-500" />
            Visually Similar Images
          </h2>
          <p className="text-slate-400 mt-1">Images that look identical but may have different resolutions, watermarks, or slight crops.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400">Recoverable Space</p>
          <p className="text-2xl font-bold text-rose-400">{formatSize(totalWasted)}</p>
        </div>
      </div>

      <div className="space-y-8">
        {groups.map((group, index) => (
          <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="bg-blue-900/50 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-800/50 flex items-center gap-1">
                  <Layers size={14} /> Match Group {index + 1}
                </span>
                <span className="text-sm text-slate-500">{group.files.length} visually similar versions</span>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.files.map((file, i) => (
                <div key={file.id} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col relative group">
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button 
                      onClick={() => handleOpenFile(file.path)}
                      title="Open file in external viewer"
                      className="bg-slate-900/80 hover:bg-blue-600 text-slate-300 hover:text-white p-1.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <input type="checkbox" className="w-5 h-5 rounded shadow-sm border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100" />
                  </div>
                  <div className="h-40 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {/* Render local image URL safely */}
                    <img 
                      src={`file:///${file.path.replace(/\\/g, '/')}`} 
                      alt={file.name} 
                      className="object-contain w-full h-full"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-3 border-t border-slate-800 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-slate-200 text-sm font-medium truncate" title={file.name}>{file.name}</p>
                      <p className="text-slate-500 text-xs truncate mt-1" title={file.path}>{file.path}</p>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                      <span className="font-mono bg-slate-800 px-2 py-0.5 rounded">{formatSize(file.size)}</span>
                      <span>{new Date(file.modifiedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900 border border-dashed border-slate-800 rounded-2xl">
            <ImageIcon size={48} className="mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-slate-300">No Similar Images Found</h3>
            <p className="text-slate-500 mt-2">Your image library doesn't contain visual duplicates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
