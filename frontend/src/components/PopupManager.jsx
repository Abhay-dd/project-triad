import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

import { API_URL as API } from '../config';

export default function PopupManager() {
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let timer;

    axios.get(`${API}/settings/popup`)
      .then((r) => {
        const data = r.data;
        if (isMounted && data && data.active) {
          setPopupData(data);
          timer = setTimeout(() => {
            if (isMounted) setShowPopup(true);
          }, 5000);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const isAdminPage = location.pathname.startsWith('/admin');

  if (!showPopup || !popupData || isAdminPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[var(--ink)] text-white p-6 shadow-2xl border border-[var(--gold)]/30 fade-up" data-testid="popup-new-launch">
      <button 
        onClick={() => setShowPopup(false)} 
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        aria-label="Close popup"
      >
        <X size={16} />
      </button>
      
      <div className="overline text-[var(--gold)] mb-2">{popupData.tag}</div>
      <h3 className="font-display text-2xl mb-2">{popupData.title}</h3>
      <p className="text-sm text-white/80 mb-6">
        {popupData.description}
      </p>
      
      <div className="flex gap-4">
        {popupData.btn1_label && popupData.btn1_link && (
          <Link 
            to={popupData.btn1_link} 
            className="btn-gold !px-4 !py-3 !text-[10px]"
            onClick={() => setShowPopup(false)}
          >
            {popupData.btn1_label}
          </Link>
        )}
        {popupData.btn2_label && popupData.btn2_link && (
          <Link 
            to={popupData.btn2_link} 
            className="btn-ghost-light !px-4 !py-3 !text-[10px]"
            onClick={() => setShowPopup(false)}
          >
            {popupData.btn2_label}
          </Link>
        )}
      </div>
    </div>
  );
}
