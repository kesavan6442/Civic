import React from 'react';
import { Link } from 'react-router-dom';
import { JharkhandCrest } from './Icons';

export const Footer = ({ lang, onSelectRole }) => {
  const isHindi = lang === 'hi';

  const handleRoleClick = (roleId) => {
    if (onSelectRole) {
      onSelectRole(roleId);
    }
  };

  return (
    <footer className="portal-footer">
      <div className="footer-top">
        <div className="footer-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <JharkhandCrest size={34} />
            <div>
              <h4 style={{ margin: 0, paddingBottom: 0 }}>CivicConnect</h4>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {isHindi ? 'झारखंड सरकार' : 'Government of Jharkhand'}
              </span>
            </div>
          </div>
          <p>
            {isHindi 
              ? 'सिविक कनेक्ट झारखंड सरकार का एकीकृत डिजिटल प्लेटफॉर्म है, जो नागरिकों, विश्वविद्यालयों, उद्योगों और प्रशासनिक तंत्र को एक सूत्र में जोड़ता है।'
              : 'Civic Connect is an integrated digital platform by the Government of Jharkhand uniting Citizens, Universities, Industries, and Administration for rapid grievance redressal and transparent governance.'}
          </p>
          <div style={{ fontSize: '0.8rem', color: '#a8dfb8' }}>
            <strong>{isHindi ? 'राज्य हेल्पलाइन:' : 'State Helpline:'}</strong> 181 (CM Jan Samvaad) / 112
          </div>
        </div>

        <div className="footer-col">
          <h4>{isHindi ? 'भूमिकाएं (Portals)' : 'Portals & Modules'}</h4>
          <ul className="footer-links">
            <li><Link to="/citizen" onClick={() => handleRoleClick('citizen')}>{isHindi ? 'नागरिक पोर्टल' : 'Citizen Portal'}</Link></li>
            <li><Link to="/university" onClick={() => handleRoleClick('university')}>{isHindi ? 'विश्वविद्यालय नेटवर्क' : 'University Network'}</Link></li>
            <li><Link to="/industry" onClick={() => handleRoleClick('industry')}>{isHindi ? 'उद्योग एवं सीएसआर' : 'Industry & CSR PPP'}</Link></li>
            <li><Link to="/admin" onClick={() => handleRoleClick('admin')}>{isHindi ? 'प्रशासनिक लॉगिन' : 'Administrative Login'}</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{isHindi ? 'त्वरित लिंक' : 'Quick Links'}</h4>
          <ul className="footer-links">
            <li><a href="https://jharkhand.gov.in" target="_blank" rel="noreferrer">Jharkhand State Portal</a></li>
            <li><a href="https://jharsewa.jharkhand.gov.in" target="_blank" rel="noreferrer">JharSewa Portal</a></li>
            <li><a href="#stats">District Performance</a></li>
            <li><a href="#grievance">Grievance SLA Status</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{isHindi ? 'कानूनी एवं सहायता' : 'Policy & Help'}</h4>
          <ul className="footer-links">
            <li><a href="#privacy">{isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</a></li>
            <li><a href="#terms">{isHindi ? 'नियम एवं शर्तें' : 'Terms of Service'}</a></li>
            <li><a href="#hyperlink">{isHindi ? 'हाइपरलिंक नीति' : 'Hyperlinking Policy'}</a></li>
            <li><a href="#security">{isHindi ? 'सुरक्षा दिशानिर्देश' : 'Security Guidelines'}</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © {new Date().getFullYear()} {isHindi ? 'झारखंड सरकार • सर्वाधिकार सुरक्षित' : 'Government of Jharkhand • All Rights Reserved.'}
        </div>
        <div style={{ marginTop: '4px', opacity: 0.8 }}>
          {isHindi 
            ? 'सूचना प्रौद्योगिकी एवं ई-गवर्नेंस विभाग, झारखंड द्वारा संचालित' 
            : 'Powered by Department of Information Technology & e-Governance, Jharkhand'}
        </div>
      </div>
    </footer>
  );
};
