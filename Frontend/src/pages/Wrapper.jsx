import React, { useState } from 'react';
import NewPublicationsCount from './NewPub';
import KeywordCounts from './Keyword';
import MultiGroupPapersCount from './MultiGroup';
import GroupAuthorMultiGroup from './MultiAuthor';
import TotalPapersPerGroup from './TotalPPG';
import KeywordCountsPerGroup from './KeywordPG';

const ReportsDashboard = () => {
  const [showReports, setShowReports] = useState(false);

  const handleGenerateReports = () => {
    setShowReports(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <button
          onClick={handleGenerateReports}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all duration-200"
        >
          Generate Reports
        </button>
      </div>

      {showReports && (
        <div className="space-y-10">
          <ReportSection title="New Publications Count">
            <NewPublicationsCount />
          </ReportSection>

          {/* <ReportSection title="Keyword Counts">
            <KeywordCounts />
          </ReportSection> */}

          <ReportSection title="Multi-Group Papers Count">
            <MultiGroupPapersCount />
          </ReportSection>

          <ReportSection title="Group Author Multi-Group">
            <GroupAuthorMultiGroup />
          </ReportSection>

          <ReportSection title="Total Papers Per Group">
            <TotalPapersPerGroup />
          </ReportSection>

          <ReportSection title="Keyword Counts Per Group">
            <KeywordCountsPerGroup />
          </ReportSection>
        </div>
      )}
    </div>
  );
};

// Reusable styled report card component
const ReportSection = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl shadow p-6">
    <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
    {children}
  </div>
);

export default ReportsDashboard;
