import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
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
    /* Responsive: full-width on mobile with margin, fixed bottom-right on sm+ */
    <div
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm bg-[var(--ink)] text-white shadow-2xl border border-[var(--gold)]/30 fade-up"
      data-testid="popup-new-launch"
    >
      {/* Gold top accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[var(--gold-deep)] via-[var(--gold)] to-[var(--gold-deep)]" />

      <div className="p-5 sm:p-6">
        {/* Close button */}
        <button
          onClick={() => setShowPopup(false)}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close popup"
        >
          <X size={15} />
        </button>

        <div className="overline text-[var(--gold)] mb-2 pr-8">{popupData.tag}</div>
        <h3 className="font-display text-xl sm:text-2xl mb-2 pr-8 leading-tight">{popupData.title}</h3>
        <p className="text-sm text-white/75 mb-5 leading-relaxed">
          {popupData.description}
        </p>

        <div className="flex flex-wrap gap-3">
          {popupData.btn1_label && popupData.btn1_link && (
            <Link
              to={popupData.btn1_link}
              className="btn-gold !px-4 !py-2.5 !text-[10px] flex items-center gap-2"
              onClick={() => setShowPopup(false)}
            >
              {popupData.btn1_label}
              <ArrowRight size={12} />
            </Link>
          )}
          {popupData.btn2_label && popupData.btn2_link && (
            <Link
              to={popupData.btn2_link}
              className="btn-ghost-light !px-4 !py-2.5 !text-[10px]"
              onClick={() => setShowPopup(false)}
            >
              {popupData.btn2_label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
