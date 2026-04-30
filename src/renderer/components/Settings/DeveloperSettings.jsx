import React, { useState, useEffect } from 'react';
import { useConnectionStore } from '../../store/connectionStore';
import { Terminal, Copy, Check, ExternalLink, ShieldCheck, Zap, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DeveloperSettings = () => {
  const { activeConnection } = useConnectionStore();
  const [apiInfo, setApiInfo] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiInfo = async () => {
      if (!activeConnection) {
        setLoading(false);
        return;
      }
      
      try {
        const info = await window.electronAPI.getApiInfo(activeConnection.id);
        setApiInfo(info);
      } catch (err) {
        console.error('Failed to fetch API info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApiInfo();
  }, [activeConnection]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="settings-panel flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Loading Developer Settings...</div>
      </div>
    );
  }

  if (!activeConnection) {
    return (
      <div className="settings-panel">
        <div className="no-connection-message bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 text-center">
          <Info className="mx-auto mb-4 text-amber-500" size={32} />
          <h3 className="text-amber-500 font-bold mb-2">No Active Connection</h3>
          <p className="text-gray-400">Please connect to a database to access Developer and PostgREST API settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Terminal size={24} className="text-blue-500" />
          <h3 className="text-2xl font-bold">Developer Settings</h3>
        </div>
        <p className="text-gray-400 text-sm">Manage your API gateway and developer credentials.</p>
      </div>

      <div className="setting-group mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-yellow-500" />
          <label className="text-sm font-semibold uppercase tracking-wider text-gray-400">PostgREST API Gateway</label>
        </div>
        
        {!apiInfo ? (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-4">The PostgREST API Gateway is currently offline for this connection.</p>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm transition-colors"
              onClick={async () => {
                setLoading(true);
                try {
                  const info = await window.electronAPI.startApi(activeConnection.id);
                  setApiInfo(info);
                  toast.success('API Gateway started successfully');
                } catch (err) {
                  toast.error(`Failed to start API Gateway: ${err.message || err}`);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Start API Gateway
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* API URL */}
            <div className="developer-card bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 font-medium">ENDPOINT URL</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(apiInfo.apiUrl, 'API URL')}
                    className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400"
                  >
                    {copiedField === 'API URL' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <a 
                    href={apiInfo.apiUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <code className="text-blue-400 text-sm font-mono break-all">{apiInfo.apiUrl}</code>
            </div>

            {/* JWT Secret */}
            <div className="developer-card bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-xs text-gray-500 font-medium">JWT SECRET</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(apiInfo.jwtSecret, 'JWT Secret')}
                  className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400"
                >
                  {copiedField === 'JWT Secret' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <code className="text-gray-300 text-xs font-mono break-all line-clamp-1 hover:line-clamp-none transition-all">
                {apiInfo.jwtSecret}
              </code>
              <p className="mt-2 text-[10px] text-gray-500 italic">
                Use this secret to sign JWT tokens for authenticating with the API.
              </p>
            </div>
            
            {/* Postgres Manager Key */}
            <div className="developer-card bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Postgres Manager Key</span>
                </div>
                <button 
                  onClick={() => {
                    const key = `@pm-gateway:${btoa(apiInfo.apiUrl + '::' + apiInfo.jwtSecret)}`;
                    navigator.clipboard.writeText(key);
                    toast.success('Manager Key copied!');
                  }}
                  className="p-1.5 hover:bg-gray-700 rounded-md transition-colors text-gray-400"
                >
                  <Copy size={14} />
                </button>
              </div>
              <code className="text-blue-300 text-[11px] font-mono break-all line-clamp-1">
                @pm-gateway:{btoa(apiInfo.apiUrl + '::' + apiInfo.jwtSecret).substring(0, 40)}...
              </code>
              <p className="mt-2 text-[10px] text-gray-500">
                Use this key in Python, PHP, or Node.js to auto-connect to this gateway.
              </p>
            </div>

            {/* Integration Snippets */}
            <div className="mt-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 block">Integration Snippets</label>
              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="flex bg-gray-800/50 border-b border-gray-700">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-blue-400 border-r border-gray-700">PYTHON</div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 border-r border-gray-700">PHP</div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500">NODE.JS</div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-[11px] text-gray-400 font-mono leading-relaxed">
{`# Connect using requests
import requests
url = "${apiInfo.apiUrl}/your_table"
headers = {"Authorization": "Bearer ${apiInfo.jwtSecret}"}
response = requests.get(url, headers=headers)
print(response.json())`}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
                <button 
                  className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
                  onClick={async () => {
                    await window.electronAPI.stopApi(activeConnection.id);
                    setApiInfo(null);
                    toast('API Gateway stopped');
                  }}
                >
                  <EyeOff size={14} />
                  Stop Gateway
                </button>
            </div>
          </div>
        )}
      </div>

      <div className="setting-group mt-10">
        <label className="text-sm font-semibold uppercase tracking-wider text-gray-400 block mb-4">Quick Guide</label>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4">
             <div className="text-blue-500 font-bold text-xs mb-1">01. Mapping</div>
             <p className="text-[10px] text-gray-500 leading-normal">Automatic RESTful mapping for your database schema.</p>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4">
             <div className="text-blue-500 font-bold text-xs mb-1">02. RESTful</div>
             <p className="text-[10px] text-gray-500 leading-normal">Standard GET, POST, PATCH, and DELETE operations.</p>
          </div>
          <div className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4">
             <div className="text-blue-500 font-bold text-xs mb-1">03. Secure</div>
             <p className="text-[10px] text-gray-500 leading-normal">JWT based authentication for all external requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperSettings;
