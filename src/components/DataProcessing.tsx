import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, XCircle, AlertCircle, Download, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataProcessor } from '../utils/dataProcessor';
import { DataProcessingJob } from '../types';

const DataProcessing: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<DataProcessingJob[]>([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState('amazon');
  const [isProcessing, setIsProcessing] = useState(false);

  const dataProcessor = new DataProcessor();

  const marketplaces = [
    { id: 'amazon', name: 'Amazon', color: 'bg-orange-500' },
    { id: 'ebay', name: 'eBay', color: 'bg-blue-500' },
    { id: 'shopify', name: 'Shopify', color: 'bg-green-500' },
    { id: 'walmart', name: 'Walmart', color: 'bg-blue-600' },
    { id: 'etsy', name: 'Etsy', color: 'bg-orange-600' },
    { id: 'custom', name: 'Custom CSV', color: 'bg-gray-500' },
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (csvFiles.length > 0) {
      setFiles(prev => [...prev, ...csvFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const newJobs: DataProcessingJob[] = [];

    for (const file of files) {
      const job = await dataProcessor.processFile(
        file,
        selectedMarketplace,
        [], // In a real app, pass existing products
        (progress) => {
          setJobs(currentJobs => 
            currentJobs.map(j => 
              j.fileName === file.name ? { ...j, progress } : j
            )
          );
        }
      );
      newJobs.push(job);
    }

    setJobs(prev => [...prev, ...newJobs]);
    setFiles([]);
    setIsProcessing(false);
  };

  const downloadTemplate = (marketplace: string) => {
    const templates = {
      amazon: 'order-id,product-name,sku,quantity,unit-price,total,fees,order-date,status\n"123-456-789","Sample Product","B08K1234567",2,29.99,59.98,8.99,"2024-01-15","shipped"',
      ebay: 'Sales Record Number,Title,Item ID,Quantity,Price,Total,eBay Fee,Sale Date,Order Status\n"12345678901","Sample Item","987654321012",1,24.99,24.99,2.50,"2024-01-15","Completed"',
      shopify: 'Name,SKU,Variant SKU,Quantity,Price,Total,Order,Created at,Fulfillment Status\n"Sample Product","PROD-001","VAR-001",1,19.99,19.99,"#1001","2024-01-15","fulfilled"',
      walmart: 'Purchase Order,Product Name,SKU,Quantity,Unit Price,Total,Commission,Order Date,Status\n"WM123456789","Sample Product","WM-SKU-001",1,34.99,34.99,5.25,"2024-01-15","Shipped"',
    };

    const template = templates[marketplace as keyof typeof templates] || templates.amazon;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${marketplace}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Processing Center</h1>
        <p className="text-gray-600">Upload and process sales data from multiple marketplaces with intelligent SKU mapping.</p>
      </div>

      {/* Marketplace Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Marketplace</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {marketplaces.map((marketplace) => (
            <button
              key={marketplace.id}
              onClick={() => setSelectedMarketplace(marketplace.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedMarketplace === marketplace.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 ${marketplace.color} rounded-lg mb-2 mx-auto`} />
              <p className="text-sm font-medium text-gray-900">{marketplace.name}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={() => downloadTemplate(selectedMarketplace)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download Template</span>
          </button>
          <p className="text-sm text-gray-500">
            Download a sample CSV template for {marketplaces.find(m => m.id === selectedMarketplace)?.name}
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop CSV files here or click to browse
              </h3>
              <p className="text-gray-600">
                Upload sales data CSV files from your selected marketplace. Maximum file size: 10MB
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              <h4 className="font-medium text-gray-900">Selected Files</h4>
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </motion.div>
              ))}
              
              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isProcessing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isProcessing ? 'Processing...' : 'Process Files'}</span>
                </button>
                <p className="text-sm text-gray-500">
                  {files.length} file{files.length !== 1 ? 's' : ''} ready for processing
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Processing Jobs */}
      {jobs.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing History</h3>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      job.status === 'completed' ? 'bg-green-500' :
                      job.status === 'failed' ? 'bg-red-500' :
                      job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                      'bg-gray-400'
                    }`} />
                    <h4 className="font-medium text-gray-900">{job.fileName}</h4>
                    <span className="text-sm text-gray-500">
                      {job.marketplace.charAt(0).toUpperCase() + job.marketplace.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {job.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {job.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    {job.warnings.length > 0 && (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                {job.status === 'processing' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Processed</p>
                    <p className="font-medium">{job.recordsProcessed} / {job.recordsTotal}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">File Size</p>
                    <p className="font-medium">{(job.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Errors</p>
                    <p className={`font-medium ${job.errors.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {job.errors.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Warnings</p>
                    <p className={`font-medium ${job.warnings.length > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {job.warnings.length}
                    </p>
                  </div>
                </div>

                {(job.errors.length > 0 || job.warnings.length > 0) && (
                  <div className="mt-4 space-y-2">
                    {job.errors.slice(0, 3).map((error, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        <XCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    ))}
                    {job.warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        <AlertCircle className="w-4 h-4" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataProcessing;