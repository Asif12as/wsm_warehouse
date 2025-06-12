import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DataProcessing from './components/DataProcessing';
import SKUMappingComponent from './components/SKUMapping';
import AIQuery from './components/AIQuery';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'processing':
        return <DataProcessing />;
      case 'mapping':
        return <SKUMappingComponent />;
      case 'query':
        return <AIQuery />;
      case 'products':
        return <div className="p-6"><h1 className="text-2xl font-bold">Products Management</h1><p className="text-gray-600 mt-2">Product catalog and inventory management coming soon...</p></div>;
      case 'analytics':
        return <div className="p-6"><h1 className="text-2xl font-bold">Advanced Analytics</h1><p className="text-gray-600 mt-2">Comprehensive analytics dashboard coming soon...</p></div>;
      case 'reports':
        return <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-600 mt-2">Automated reporting system coming soon...</p></div>;
      case 'database':
        return <div className="p-6"><h1 className="text-2xl font-bold">Database Management</h1><p className="text-gray-600 mt-2">Database configuration and management tools coming soon...</p></div>;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">System configuration and preferences coming soon...</p></div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto">
        {renderActiveComponent()}
      </div>
    </div>
  );
}

export default App;