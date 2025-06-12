import React, { useState } from 'react';
import { Search, MapPin, CheckCircle, XCircle, AlertCircle, RefreshCw, Filter, Download } from 'lucide-react';
import { SKUMapping } from '../types';

const SKUMappingComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showUnmapped, setShowUnmapped] = useState(false);

  // Sample data - in a real app, this would come from your data store
  const mappings: SKUMapping[] = [
    {
      id: '1',
      originalSku: 'B08K1234567',
      mappedSku: 'AMZ-B08K1234567',
      msku: 'WMS-001234',
      marketplace: 'amazon',
      confidence: 0.95,
      mappingMethod: 'automatic',
      createdAt: new Date('2024-01-15'),
      validatedAt: new Date('2024-01-16'),
      notes: 'High confidence automatic mapping'
    },
    {
      id: '2',
      originalSku: '987654321012',
      mappedSku: 'EBY-54321012',
      msku: 'WMS-001235',
      marketplace: 'ebay',
      confidence: 0.82,
      mappingMethod: 'ai_suggested',
      createdAt: new Date('2024-01-14'),
      notes: 'AI suggested mapping - review recommended'
    },
    {
      id: '3',
      originalSku: 'PROD-VARIANT-001',
      mappedSku: 'SHO-PROD-001',
      msku: 'WMS-001236',
      marketplace: 'shopify',
      confidence: 0.91,
      mappingMethod: 'automatic',
      createdAt: new Date('2024-01-13'),
      validatedAt: new Date('2024-01-13'),
    },
    {
      id: '4',
      originalSku: 'WM-UNKNOWN-789',
      mappedSku: 'WM-UNKNOWN-789',
      msku: '',
      marketplace: 'walmart',
      confidence: 0.45,
      mappingMethod: 'manual',
      createdAt: new Date('2024-01-12'),
      notes: 'Requires manual review - no similar products found'
    },
  ];

  const marketplaces = [
    { id: 'all', name: 'All Marketplaces' },
    { id: 'amazon', name: 'Amazon' },
    { id: 'ebay', name: 'eBay' },
    { id: 'shopify', name: 'Shopify' },
    { id: 'walmart', name: 'Walmart' },
  ];

  const statuses = [
    { id: 'all', name: 'All Status' },
    { id: 'verified', name: 'Verified' },
    { id: 'pending', name: 'Pending Review' },
    { id: 'failed', name: 'Failed' },
  ];

  const getStatusInfo = (mapping: SKUMapping) => {
    if (mapping.validatedAt) {
      return { status: 'verified', color: 'text-green-600 bg-green-50', icon: CheckCircle };
    } else if (mapping.confidence < 0.6) {
      return { status: 'failed', color: 'text-red-600 bg-red-50', icon: XCircle };
    } else {
      return { status: 'pending', color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle };
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = mapping.originalSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.mappedSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mapping.msku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMarketplace = selectedMarketplace === 'all' || mapping.marketplace === selectedMarketplace;
    
    const statusInfo = getStatusInfo(mapping);
    const matchesStatus = selectedStatus === 'all' || statusInfo.status === selectedStatus;
    
    const matchesUnmapped = !showUnmapped || !mapping.msku;

    return matchesSearch && matchesMarketplace && matchesStatus && matchesUnmapped;
  });

  const stats = {
    total: mappings.length,
    verified: mappings.filter(m => m.validatedAt).length,
    pending: mappings.filter(m => !m.validatedAt && m.confidence >= 0.6).length,
    failed: mappings.filter(m => m.confidence < 0.6).length,
    averageConfidence: (mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length * 100).toFixed(1),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SKU Mapping Management</h1>
        <p className="text-gray-600">Manage and validate SKU mappings across all marketplaces with intelligent automation.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mappings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Confidence</p>
              <p className="text-2xl font-bold text-purple-600">{stats.averageConfidence}%</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Mappings</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by original SKU, mapped SKU, or MSKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marketplace</label>
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {marketplaces.map(marketplace => (
                <option key={marketplace.id} value={marketplace.id}>
                  {marketplace.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showUnmapped}
                onChange={(e) => setShowUnmapped(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Show only unmapped SKUs</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Advanced Filters</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Original SKU</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Mapped SKU</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Master SKU</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Marketplace</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Confidence</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Method</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMappings.map((mapping) => {
                const statusInfo = getStatusInfo(mapping);
                const StatusIcon = statusInfo.icon;

                return (
                  <tr key={mapping.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{mapping.originalSku}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900">{mapping.mappedSku}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-medium ${mapping.msku ? 'text-blue-600' : 'text-gray-400'}`}>
                        {mapping.msku || 'Not assigned'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-900 capitalize">{mapping.marketplace}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          mapping.confidence >= 0.8 ? 'bg-green-500' :
                          mapping.confidence >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="text-gray-900">{(mapping.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        mapping.mappingMethod === 'automatic' ? 'bg-green-100 text-green-800' :
                        mapping.mappingMethod === 'ai_suggested' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mapping.mappingMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="capitalize">{statusInfo.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMappings.length === 0 && (
          <div className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No mappings found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SKUMappingComponent;