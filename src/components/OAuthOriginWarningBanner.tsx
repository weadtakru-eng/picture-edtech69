import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, X, ChevronDown, ChevronUp, ShieldAlert, Copy, Check } from 'lucide-react';
import {
  subscribeOAuthOriginWarning,
  dismissOAuthOriginWarning,
  setOAuthOriginWarning,
  verifyOAuthOrigin,
  OAuthOriginVerification,
  PRODUCTION_AUTHORIZED_ORIGIN
} from '../utils/oauthVerifier';

export const OAuthOriginWarningBanner: React.FC = () => {
  const [warning, setWarning] = useState<OAuthOriginVerification | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check origin on mount to alert the user before triggering Google OAuth flow
    const verification = verifyOAuthOrigin();
    if (!verification.isValid) {
      setOAuthOriginWarning(verification);
    }

    const unsubscribe = subscribeOAuthOriginWarning((activeWarning) => {
      setWarning(activeWarning);
    });
    return () => unsubscribe();
  }, []);

  if (!warning || warning.isValid) {
    return null;
  }

  const handleCopyOrigin = () => {
    if (warning.currentOrigin) {
      navigator.clipboard.writeText(warning.currentOrigin).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 relative z-30 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-amber-950 flex items-center gap-2 flex-wrap">
              <span>แจ้งเตือนก่อนเริ่ม Google OAuth: ตรวจพบ Origin ไม่ตรงกับ Google Cloud Console</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono">
                Error 400 Prevention
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
              URL ปัจจุบัน (<span className="font-mono font-medium text-amber-950">{warning.currentOrigin}</span>) 
              ยังไม่ได้ลงทะเบียนใน Authorized JavaScript origins สำหรับ Client ID <span className="font-mono text-xs">{warning.clientId.slice(0, 16)}...</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-amber-800 hover:text-amber-950 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-amber-100/80 transition-colors"
          >
            <span>{isExpanded ? 'ซ่อนคำแนะนำ' : 'วิธีแก้ไข'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {!warning.isProductionOrigin && (
            <a
              href={PRODUCTION_AUTHORIZED_ORIGIN}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium transition-colors shadow-xs"
            >
              <span>เปิด Production URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => dismissOAuthOriginWarning()}
            className="p-1 text-amber-600 hover:text-amber-900 rounded-md hover:bg-amber-100 transition-colors"
            title="ปิดการแจ้งเตือน"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-amber-200/80 text-xs text-amber-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
            <p className="font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
              <span>ทางเลือกที่ 1: ใช้งานบน Production Vercel ที่ได้รับอนุญาตแล้ว</span>
            </p>
            <p className="text-amber-800 mb-2">
              โดเมนหลักของโรงเรียนได้รับการลงทะเบียนใน Google Cloud Console เรียบร้อยแล้ว:
            </p>
            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded border border-amber-200/60 font-mono text-xs">
              <span className="truncate flex-1">{PRODUCTION_AUTHORIZED_ORIGIN}</span>
              <a
                href={PRODUCTION_AUTHORIZED_ORIGIN}
                className="text-amber-700 hover:text-amber-900 font-sans font-semibold inline-flex items-center gap-1 shrink-0"
              >
                เข้าใช้งาน <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
            <p className="font-semibold text-amber-950 mb-1 flex items-center gap-1.5">
              <span>ทางเลือกที่ 2: เพิ่ม Origin ปัจจุบันใน Google Cloud Console</span>
            </p>
            <p className="text-amber-800 mb-2">
              เพิ่ม URL ปัจจุบันนี้เข้าสู่รายการ Authorized JavaScript origins:
            </p>
            <div className="flex items-center gap-2 bg-amber-50 p-2 rounded border border-amber-200/60 font-mono text-xs mb-2">
              <span className="truncate flex-1">{warning.currentOrigin}</span>
              <button
                onClick={handleCopyOrigin}
                className="px-2 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded font-sans text-xs flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก Origin'}</span>
              </button>
            </div>
            <a
              href={warning.gcpConsoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 hover:text-amber-950 font-medium inline-flex items-center gap-1 underline underline-offset-2"
            >
              เปิดหน้าจัดการ Credentials ใน Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
