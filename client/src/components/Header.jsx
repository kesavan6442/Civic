import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PhoneIcon, GlobeIcon, JharkhandCrest } from './Icons';
import { offlineSyncService } from '../services/offlineSyncService';

export const Header = ({ lang, onToggleLang }) => {
  const navigate = useNavigate();
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false
  });

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((status) => {
      setNetworkStatus(status);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="admin-topbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* Left side: Crest, Brand & Portal Title */}
      <div className="admin-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
          <JharkhandCrest size={34} />
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: '1.08rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
              CivicConnect
            </div>
            <div style={{ fontSize: '0.68rem', color: '#D1FAE5', fontWeight: 600 }}>
              {lang === 'hi' ? 'झारखंड सरकार' : 'Govt. of Jharkhand'}
            </div>
          </div>
        </Link>

        <div className="header-divider desktop-only" style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.25)', margin: '0 4px' }} />

        <div className="header-entity-info desktop-only">
          <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{lang === 'hi' ? 'एकीकृत नागरिक एवं संस्थागत पोर्टल' : 'Unified Civic & Institutional Portal'}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.82)' }}>
            {lang === 'hi' ? 'सूचना प्रौद्योगिकी एवं ई-गवर्नेंस विभाग' : 'Dept. of IT & e-Governance • Government of Jharkhand'}
          </div>
        </div>
      </div>

      {/* Right side: Live Sync Status, Helpline & Language Toggle */}
      <div className="admin-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Low Network & Background Sync Indicator */}
        <div 
          className="header-sync-status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: '20px',
            background: !networkStatus.isOnline 
              ? 'rgba(239, 68, 68, 0.25)' 
              : (networkStatus.pendingCount > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'),
            border: `1px solid ${!networkStatus.isOnline ? '#ef4444' : (networkStatus.pendingCount > 0 ? '#f59e0b' : '#10b981')}`,
            color: '#ffffff',
            fontWeight: 600
          }}
          title={!networkStatus.isOnline ? 'Operating in offline local-first mode. Data will auto-sync when online.' : 'Connected to CivicConnect Backend'}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: !networkStatus.isOnline ? '#ef4444' : (networkStatus.isSyncing ? '#3b82f6' : '#10b981')
          }}></span>
          <span className="desktop-only">
            {!networkStatus.isOnline 
              ? (lang === 'hi' ? `ऑफ़लाइन (${networkStatus.pendingCount})` : `Offline (${networkStatus.pendingCount})`)
              : (networkStatus.isSyncing
                  ? (lang === 'hi' ? 'सिंक हो रहा है...' : 'Syncing...')
                  : (networkStatus.pendingCount > 0 
                      ? (lang === 'hi' ? `कतार (${networkStatus.pendingCount})` : `Queue (${networkStatus.pendingCount})`)
                      : (lang === 'hi' ? 'क्लाउड कनेक्टेड' : 'Cloud Connected')
                    )
                )
            }
          </span>
        </div>

        {/* 24x7 Helpline (Desktop only to prevent mobile crowding) */}
        <div className="desktop-only" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: '#FFFFFF',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontWeight: 600
        }}>
          <PhoneIcon size={12} />
          <span>{lang === 'hi' ? 'हेल्पलाइन:' : 'Toll Free:'} 181 / 112</span>
          <span style={{
            background: '#EF4444',
            color: '#FFFFFF',
            fontSize: '0.62rem',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '10px'
          }}>24x7</span>
        </div>

        {/* Language Switcher */}
        <button 
          type="button"
          onClick={onToggleLang}
          title="Change Language"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          <GlobeIcon size={14} />
          <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
        </button>
      </div>
    </header>
  );
};
