import React, { useState, useEffect } from 'react';
import { Save, Filter, FolderX } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    excludedExtensions: [],
    excludedDirs: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(data => {
        setSettings({
          excludedExtensions: data.excludedExtensions || [],
          excludedDirs: data.excludedDirs || []
        });
        setLoading(false);
      });
    }
  }, []);

  const handleSave = async () => {
    if (window.electronAPI) {
      setSaving(true);
      await window.electronAPI.saveSettings(settings);
      setTimeout(() => setSaving(false), 500); // UI feedback
    }
  };

  const handleExtChange = (e) => {
    const exts = e.target.value.split(',').map(s => s.trim()).filter(s => s.startsWith('.'));
    setSettings(prev => ({ ...prev, excludedExtensions: exts }));
  };

  const handleDirChange = (e) => {
    const dirs = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setSettings(prev => ({ ...prev, excludedDirs: dirs }));
  };

  if (loading) return <div className="p-8 text-slate-400">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">Settings</h2>
          <p className="text-slate-400 mt-1">Configure scan filters and engine behavior.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2 mb-4">
          <Filter size={20} className="text-indigo-400" />
          Scan Filters (Exclusions)
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Excluded File Extensions
          </label>
          <p className="text-xs text-slate-500 mb-3">Comma separated list. These files will be ignored to speed up scans and avoid clutter (e.g. programming files).</p>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            defaultValue={settings.excludedExtensions.join(', ')}
            onChange={handleExtChange}
            placeholder=".css, .js, .html, .dll"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 mt-6">
            Excluded Folders
          </label>
          <p className="text-xs text-slate-500 mb-3">Comma separated list of exact folder names to skip (e.g. System folders, node_modules).</p>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            defaultValue={settings.excludedDirs.join(', ')}
            onChange={handleDirChange}
            placeholder="node_modules, .git, Windows"
          />
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm opacity-50">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2 mb-2">
          <FolderX size={20} className="text-slate-400" />
          Advanced Engine Options
        </h3>
        <p className="text-sm text-slate-400 mb-4">These features are currently locked or in development.</p>
        
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" disabled checked className="rounded border-slate-600 bg-slate-800 text-blue-600" />
          <span className="text-sm text-slate-300">Enable Perceptual Hashing (Images)</span>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" disabled className="rounded border-slate-600 bg-slate-800 text-blue-600" />
          <span className="text-sm text-slate-300">Enable Media Fingerprinting (FFmpeg)</span>
        </div>
      </div>
    </div>
  );
}
