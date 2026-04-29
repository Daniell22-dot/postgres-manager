import React from 'react';
import { Users, UserPlus, Share2, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeamSettings = () => {
  const handleAction = (action) => {
    toast.info(`${action} will be available in the Cloud Sync update!`, {
      icon: null
    });
  };

  return (
    <div className="settings-panel">
      <div className="panel-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} className="text-cyan-500" />
          <h3 className="text-2xl font-bold">Team Collaboration</h3>
        </div>
        <p className="text-gray-400 text-sm">Share connections and queries with your team members.</p>
      </div>

      <div className="bg-cyan-500/5 border-gray-700/50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Globe size={32} className="text-cyan-500" />
        </div>
        <h4 className="text-lg font-bold mb-2">Cloud Sync Coming Soon</h4>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
          Soon you will be able to synchronize your connection profiles and saved queries across multiple devices and team members.
        </p>
        <button 
          className="btn-primary"
          style={{ background: '#0891b2' }}
          onClick={() => handleAction('Notifications')}
        >
          Get Notified
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button 
          className="btn-premium flex items-center justify-center gap-3"
          onClick={() => handleAction('Sharing')}
        >
          <Share2 size={18} className="text-cyan-500" />
          <span>Share Connection</span>
        </button>
        <button 
          className="btn-premium flex items-center justify-center gap-3"
          onClick={() => handleAction('Invites')}
        >
          <UserPlus size={18} className="text-cyan-500" />
          <span>Invite Member</span>
        </button>
      </div>
    </div>
  );
};

export default TeamSettings;
