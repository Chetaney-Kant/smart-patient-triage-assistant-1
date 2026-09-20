import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const DisclaimerBanner: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Re-display warning banner every time a user logs in
  useEffect(() => {
    setDismissed(false);
  }, [user?.id]);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs md:text-sm text-amber-900 dark:text-amber-200 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>{t('disclaimerText')}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/safety-limitations"
            className="underline font-semibold whitespace-nowrap text-amber-800 dark:text-amber-300 hover:text-amber-900"
          >
            {t('safetyPolicyLink')}
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss disclaimer"
            title="Dismiss disclaimer"
            className="p-1 rounded-md text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
