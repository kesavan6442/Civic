import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { IndustryIcon } from '../../components/Icons';

export const IndustryPortal = ({ lang, onToggleLang }) => {
  const navigate = useNavigate();
  const isHindi = lang === 'hi';

  const industryInitiatives = [
    {
      id: 'csr-matching',
      titleEn: 'District CSR Project Directory',
      titleHi: 'जिला सीएसआर परियोजना निर्देशिका',
      descEn: 'Invest CSR funds into vetted rural health clinics, smart schools, and water conservation projects.',
      descHi: 'सत्यापित ग्रामीण स्वास्थ्य केंद्रों, स्मार्ट स्कूलों एवं जल संरक्षण परियोजनाओं में सीएसआर फंड का निवेश करें।',
      tagEn: 'Section 135 Compliant',
      tagHi: 'धारा 135 अनुपालित'
    },
    {
      id: 'ppp-bids',
      titleEn: 'Public-Private Partnership (PPP) Opportunities',
      titleHi: 'सार्वजनिक-निजी भागीदारी (PPP) अवसर',
      descEn: 'Participate in state infrastructure tenders, industrial logistics parks, and green energy concessions.',
      descHi: 'राज्य अवसंरचना निविदाओं, औद्योगिक लॉजिस्टिक्स पार्कों एवं हरित ऊर्जा रियायतों में भाग लें।',
      tagEn: 'E-Procurement Live',
      tagHi: 'ई-प्रोक्योरमेंट लाइव'
    },
    {
      id: 'skill-alignment',
      titleEn: 'Youth Skill Development & Apprenticeships',
      titleHi: 'युवा कौशल विकास एवं शिक्षुता',
      descEn: 'Partner with ITIs and polytechnic colleges across Jharkhand to train high-demand industrial manpower.',
      descHi: 'उच्च-मांग वाले औद्योगिक जनशक्ति को प्रशिक्षित करने हेतु राज्य के आईटीआई एवं पॉलिटेक्निक संस्थानों से साझेदारी करें।',
      tagEn: 'JSDM Integrated',
      tagHi: 'जेएसडीएम एकीकृत'
    },
    {
      id: 'single-window',
      titleEn: 'Single-Window Industrial Clearance',
      titleHi: 'सिंगल-विंडो औद्योगिक क्लीयरेंस',
      descEn: 'Fast-track environmental clearances, land allotment, power connection, and state incentives.',
      descHi: 'पर्यावरण मंजूरी, भूमि आवंटन, बिजली कनेक्शन एवं राज्य प्रोत्साहनों के लिए त्वरित समाधान।',
      tagEn: 'Ease of Business',
      tagHi: 'व्यापार सुगमता'
    }
  ];

  return (
    <div className="app-container">
      <Header lang={lang} onToggleLang={onToggleLang} />

      <main className="portal-page-container" style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Top Breadcrumb / Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            className="univ-nav-btn univ-btn-backhome"
            onClick={() => navigate('/')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: '#036D33', border: '1px solid rgba(3, 109, 51, 0.25)', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            <span>← {isHindi ? 'सभी पोर्टल' : 'All Portals'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#4B5563' }}>
            <span style={{ color: '#036D33', fontWeight: 600 }}>{isHindi ? 'उद्योग एवं सीएसआर' : 'Industry & CSR Portal'}</span>
            <span>•</span>
            <span>{isHindi ? 'कॉर्पोरेट व पीपीपी' : 'Enterprise & PPP Gateway'}</span>
          </div>
        </div>

        {/* Hero Banner for Industry Portal */}
        <div className="univ-welcome-banner" style={{ marginBottom: '28px', borderLeft: '5px solid #036D33' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#E8F5E9', padding: '8px', borderRadius: '8px', color: '#036D33', display: 'flex' }}>
                <IndustryIcon size={28} />
              </div>
              <h1 className="univ-welcome-title" style={{ margin: 0 }}>
                {isHindi ? 'उद्योग एवं सीएसआर सहभागिता मंच' : 'Industry & CSR Partnership Portal'}
              </h1>
            </div>
            <div className="univ-welcome-meta">
              <span>{isHindi ? 'उद्योग एवं खान विभाग, झारखंड' : 'Department of Industries & Mines, Jharkhand'}</span>
              <span>•</span>
              <span>{isHindi ? 'कॉर्पोरेट सामाजिक उत्तरदायित्व एवं पीपीपी सेल' : 'CSR & PPP Investment Cell'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="univ-welcome-tag">
              💼 {isHindi ? 'सत्यापित उद्योग पोर्टल' : 'Verified Industry Network'}
            </span>
            <span className="univ-welcome-tag" style={{ background: '#036D33', color: '#FFFFFF' }}>
              320+ Industry Partners
            </span>
          </div>
        </div>

        {/* Initiatives Grid */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1F2937', marginBottom: '4px' }}>
            {isHindi ? 'प्रमुख औद्योगिक सहयोग क्षेत्र' : 'Key Enterprise Collaboration Streams'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#6B7280', marginBottom: '20px' }}>
            {isHindi ? 'राज्य के सतत विकास के लिए सार्वजनिक-निजी भागीदारी के अवसर' : 'Direct avenues for enterprise investment and public-private synergy across Jharkhand'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {industryInitiatives.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#036D33', background: '#E8F5E9', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', marginBottom: '10px' }}>
                    {isHindi ? item.tagHi : item.tagEn}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                    {isHindi ? item.titleHi : item.titleEn}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '16px' }}>
                    {isHindi ? item.descHi : item.descEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Submitting interest for ${item.titleEn}... Single-Window Desk will reach out.`)}
                  style={{
                    width: '100%',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#036D33',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{isHindi ? 'प्रस्ताव जमा करें' : 'Submit Expression of Interest'}</span>
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
