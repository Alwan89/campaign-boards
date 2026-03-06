import { HashRouter, Routes, Route } from 'react-router-dom';
import CampaignBoard from './pages/CampaignBoard';
import CampaignIndex from './pages/CampaignIndex';
import CampaignBuilder from './pages/CampaignBuilder';
import StudioIndex from './pages/StudioIndex';
import StudioSetup from './pages/StudioSetup';
import StudioWorkspace from './pages/StudioWorkspace';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CampaignIndex />} />
        <Route path="/new" element={<CampaignBuilder />} />
        <Route path="/studio" element={<StudioIndex />} />
        <Route path="/studio/new" element={<StudioSetup />} />
        <Route path="/studio/:slug" element={<StudioWorkspace />} />
        <Route path="/:slug" element={<CampaignBoard />} />
      </Routes>
    </HashRouter>
  );
}
