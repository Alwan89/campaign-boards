import { createContext, useContext } from 'react';

const CampaignContext = createContext(null);

export function CampaignProvider({ campaign, children }) {
  return (
    <CampaignContext.Provider value={campaign}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const campaign = useContext(CampaignContext);
  if (!campaign) throw new Error('useCampaign must be used within CampaignProvider');
  return campaign;
}
