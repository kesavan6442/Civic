import React from 'react';

export const StatsBanner = ({ lang }) => {
  const isHindi = lang === 'hi';

  const stats = [
    {
      number: '1,28,450+',
      labelEn: 'Citizens Registered',
      labelHi: 'पंजीकृत नागरिक',
      subtextEn: 'Across 24 Districts',
      subtextHi: 'सभी 24 जिलों से'
    },
    {
      number: '48+',
      labelEn: 'Universities & Colleges',
      labelHi: 'विश्वविद्यालय व संस्थान',
      subtextEn: 'Academic Civic Partners',
      subtextHi: 'सक्रिय शोध भागीदार'
    },
    {
      number: '320+',
      labelEn: 'Industries & Corporates',
      labelHi: 'उद्योग व व्यापारिक समूह',
      subtextEn: 'CSR & PPP Initiatives',
      subtextHi: 'सीएसआर व पीपीपी सहभागी'
    },
    {
      number: '94,210+',
      labelEn: 'Resolved Grievances',
      labelHi: 'सुलझाए गए जन-मुद्दे',
      subtextEn: '92.4% Resolution Rate',
      subtextHi: '92.4% समयबद्ध समाधान'
    }
  ];

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {stats.map((item, idx) => (
          <div key={idx} className="stat-item">
            <span className="stat-number">{item.number}</span>
            <span className="stat-label">{isHindi ? item.labelHi : item.labelEn}</span>
            <span className="stat-subtext">{isHindi ? item.subtextHi : item.subtextEn}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
