import { HashRouter, Routes, Route } from 'react-router-dom';
import CampaignBoard from './pages/CampaignBoard';
import CampaignIndex from './pages/CampaignIndex';
import CampaignBuilder from './pages/CampaignBuilder';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CampaignIndex />} />
        <Route path="/new" element={<CampaignBuilder />} />
        <Route path="/:slug" element={<CampaignBoard />} />
      </Routes>
    </HashRouter>
  );
}
