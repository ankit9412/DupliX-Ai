import { useState, useEffect } from 'react';
import { LayoutDashboard, Copy, Image as ImageIcon, Video, FileAudio, Settings as SettingsIcon, Play } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import DuplicatesList from './pages/DuplicatesList';
import SimilarImages from './pages/SimilarImages';
import Settings from './pages/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanState, setScanState] = useState({
    status: 'idle', // idle, scanning, completed
    stage: '', // discovery, filtering, hashing
    scanned: 0,
    total: 0,
    scanId: null,
    totalDiscovered: 0
  });

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onScanProgress((data) => {
        setScanState(prev => ({ ...prev, ...data, status: 'scanning' }));
      });
      
      window.electronAPI.onScanComplete((data) => {
        setScanState(prev => ({ 
          ...prev, 
          status: 'completed', 
          scanId: data.scanId,
          totalDiscovered: data.filesScanned 
        }));
      });
    }
  }, []);

  const handleStartScan = async () => {
    if (window.electronAPI) {
      const paths = await window.electronAPI.selectDirectory();
      if (paths && paths.length > 0) {
        setScanState({ status: 'scanning', stage: 'discovery', scanned: 0, total: 0, scanId: null, totalDiscovered: 0 });
        await window.electronAPI.startScan(paths);
      }
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'duplicates', label: 'Exact Duplicates', icon: Copy },
    { id: 'images', label: 'Similar Images', icon: ImageIcon },
    { id: 'video', label: 'Similar Videos', icon: Video },
    { id: 'audio', label: 'Similar Audio', icon: FileAudio },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
            <Copy size={24} className="text-blue-500" />
            DupliX AI
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4">
          <button 
            onClick={handleStartScan}
            disabled={scanState.status === 'scanning'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Play size={18} />
            {scanState.status === 'scanning' ? 'Scanning...' : 'New Scan'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard scanState={scanState} onTabChange={setActiveTab} />}
        {activeTab === 'duplicates' && <DuplicatesList scanId={scanState.scanId} />}
        {activeTab === 'images' && <SimilarImages scanId={scanState.scanId} />}
        {activeTab === 'settings' && <Settings />}
        {['video', 'audio'].includes(activeTab) && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <p className="text-lg">Coming soon in Phase 2</p>
              <p className="text-sm mt-2">AI Similarity Engine</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
