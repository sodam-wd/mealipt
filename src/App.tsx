import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { SoloFormPage } from '@/pages/SoloFormPage';
import { SoloResultPage } from '@/pages/SoloResultPage';
import { ShareHubPage } from '@/pages/ShareHubPage';
import { ShareCreatePage } from '@/pages/ShareCreatePage';
import { ShareMergePage } from '@/pages/ShareMergePage';
import { ShareResultPage } from '@/pages/ShareResultPage';
import { ReceiptPage } from '@/pages/ReceiptPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { OpenLinkPage } from '@/pages/OpenLinkPage';

/** 라우트 계약 (리더 소유). HashRouter 로 GitHub Pages 하위 경로 새로고침 대응. */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solo" element={<SoloFormPage />} />
        <Route path="/solo/result" element={<SoloResultPage />} />
        <Route path="/share" element={<ShareHubPage />} />
        <Route path="/share/create" element={<ShareCreatePage />} />
        <Route path="/share/merge" element={<ShareMergePage />} />
        <Route path="/share/result" element={<ShareResultPage />} />
        <Route path="/receipt/:id" element={<ReceiptPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/archive/:id" element={<ReceiptPage />} />
        <Route path="/open" element={<OpenLinkPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
