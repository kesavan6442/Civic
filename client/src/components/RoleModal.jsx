import React, { useEffect } from 'react';
import { CloseIcon, CheckIcon, ChevronRight } from './Icons';

export const RoleModal = ({ role, onClose, onEnterModule, lang }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!role) return null;

  const isHindi = lang === 'hi';
  const isAdmin = role.id === 'admin';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`modal-header ${isAdmin ? 'admin-modal' : ''}`}>
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 700 }}>
              {isHindi ? 'झारखंड सरकार • सिविक कनेक्ट' : 'Govt. of Jharkhand • Civic Connect'}
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
              {isHindi ? `${role.titleHi} पोर्टल प्रवेश` : `${role.titleEn} Portal Gateway`}
            </h3>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <span className="modal-meta-tag">
            {isHindi ? role.badgeHi : role.badgeEn}
          </span>
          <h4 className="modal-title">
            {isHindi ? `नमस्ते, आप ${role.titleHi} के रूप में चयनित हैं` : `Welcome! You selected ${role.titleEn}`}
          </h4>
          <p className="modal-subtitle">
            {isHindi ? role.descHi : role.descEn}
          </p>

          <div className="modal-features-box">
            <div className="modal-features-title">
              {isHindi ? 'इस मॉड्यूल में उपलब्ध प्रमुख सुविधाएं:' : 'Key Capabilities in this Module:'}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(isHindi ? role.featuresHi : role.featuresEn).map((feat, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#1F2937' }}>
                  <span style={{ color: isAdmin ? '#C62828' : '#036D33' }}>
                    <CheckIcon size={14} />
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.82rem', color: '#92400E' }}>
            <strong>{isHindi ? 'मॉड्यूल स्थिति:' : 'Module Readiness:'}</strong>{' '}
            {role.id === 'university'
              ? (isHindi 
                  ? 'विश्वविद्यालय प्रमाणीकरण एवं 6-कार्ड डैशबोर्ड मॉड्यूल सक्रिय है।'
                  : 'University Authentication & Problem Statements Dashboard is active.')
              : (isHindi 
                  ? `चरण 1 पूर्ण। अब हम ${role.titleHi} मॉड्यूल में प्रवेश कर सकते हैं।` 
                  : `Phase 1 completed. Ready to enter into the dedicated ${role.titleEn} module.`)}
          </div>

          <div className="modal-actions-grid">
            <button 
              className="btn-primary-action"
              onClick={() => {
                if (onEnterModule) {
                  onEnterModule(role);
                } else {
                  alert(`Redirecting to ${role.titleEn} Secure Login & Dashboard...`);
                }
              }}
            >
              <span>{isHindi ? 'लॉगिन / साइन-अप करें' : 'Login / Register'}</span>
              <ChevronRight size={16} />
            </button>
            <button 
              className="btn-secondary-action" 
              onClick={onClose}
            >
              {isHindi ? 'वापस जाएं (Select Other)' : 'Back to Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
