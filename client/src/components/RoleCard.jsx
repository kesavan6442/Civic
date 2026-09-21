import React from 'react';
import { CitizenIcon, UniversityIcon, IndustryIcon, AdminIcon, ChevronRight, CheckIcon } from './Icons';

export const RoleCard = ({ roleData, isSelected, onSelect, lang }) => {
  const getIcon = () => {
    switch (roleData.id) {
      case 'citizen':
        return <CitizenIcon size={32} />;
      case 'university':
        return <UniversityIcon size={32} />;
      case 'industry':
        return <IndustryIcon size={32} />;
      case 'admin':
        return <AdminIcon size={32} />;
      default:
        return <CitizenIcon size={32} />;
    }
  };

  const isHindi = lang === 'hi';
  const isAdmin = roleData.id === 'admin';

  return (
    <div 
      className={`role-card ${isAdmin ? 'admin-theme' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(roleData)}
      role="button"
      tabIndex={0}
      id={`role-card-${roleData.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(roleData);
        }
      }}
    >
      <div className="role-card-badge">
        <span>{isHindi ? roleData.badgeHi : roleData.badgeEn}</span>
      </div>

      <div className="role-icon-wrapper">
        {getIcon()}
      </div>

      <div className="role-title-group">
        <h3 className="role-title-en">{roleData.titleEn}</h3>
        <div className="role-title-hi">{roleData.titleHi}</div>
      </div>

      <p className="role-description">
        {isHindi ? roleData.descHi : roleData.descEn}
      </p>

      <ul className="role-features-list">
        {(isHindi ? roleData.featuresHi : roleData.featuresEn).map((feature, idx) => (
          <li key={idx} className="role-feature-item">
            <span className="role-feature-bullet">
              <CheckIcon size={14} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="role-card-footer">
        <button 
          className="enter-role-btn" 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(roleData);
          }}
        >
          <span>
            {isHindi ? `${roleData.titleHi} पोर्टल में प्रवेश करें` : `Enter as ${roleData.titleEn}`}
          </span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
