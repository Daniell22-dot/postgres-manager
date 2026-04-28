import React from 'react';
import { ScrollText, ShieldCheck, Download } from 'lucide-react';

const LicenseSettings = () => {
  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ScrollText size={24} className="text-purple-500" />
          <h3 className="text-2xl font-bold">License Agreement</h3>
        </div>
        <p className="text-gray-400 text-sm">Postgres Manager End User License Agreement (EULA).</p>
      </div>

      <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 mb-8 max-h-[300px] overflow-y-auto">
        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
{`POSTGRES MANAGER - END USER LICENSE AGREEMENT (EULA)

1. GRANT OF LICENSE
Postgres Manager ("Software") is licensed, not sold. This license grants you a non-exclusive, non-transferable right to use the Software on your personal or work devices.

2. RESTRICTIONS
You may not:
(a) Reverse engineer, decompile, or disassemble the Software.
(b) Rent, lease, or lend the Software.
(c) Redistribute the Software without express written permission.

3. OWNERSHIP
All intellectual property rights in the Software belong to the Author (Daniel Manyasa).

4. NO WARRANTY
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

5. TERMINATION
This license is effective until terminated. Your rights under this license will terminate automatically if you fail to comply with any of its terms.`}
        </pre>
      </div>

      <div className="setting-group">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-purple-500" size={20} />
            <div>
              <p className="text-sm font-semibold">License Status: Active</p>
              <p className="text-xs text-gray-400">Personal Community Edition v1.0.0</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs transition-colors flex items-center gap-2">
            <Download size={14} />
            Export License
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseSettings;
