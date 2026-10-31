import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from '@/components/Layout';
import { Overview } from '@/features/Overview';
import { DiscountGuardrail } from '@/features/discount-guardrail/DiscountGuardrail';
import { IntegrityAuditor } from '@/features/integrity-auditor/IntegrityAuditor';
import { BankMatcher } from '@/features/bank-matcher/BankMatcher';
import { BillExplainer } from '@/features/bill-explainer/BillExplainer';
import { RenewalRadar } from '@/features/renewal-radar/RenewalRadar';
import { ReminderCentre } from '@/features/reminder-centre/ReminderCentre';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/discount-guardrail" element={<DiscountGuardrail />} />
          <Route path="/integrity-auditor" element={<IntegrityAuditor />} />
          <Route path="/bank-matcher" element={<BankMatcher />} />
          <Route path="/bill-explainer" element={<BillExplainer />} />
          <Route path="/renewal-radar" element={<RenewalRadar />} />
          <Route path="/reminder-centre" element={<ReminderCentre />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
