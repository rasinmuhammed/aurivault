"use client";
import React, { useState, useRef, useCallback } from 'react';
import { useOrganization } from "@clerk/nextjs";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Brain, 
  Shield,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Clock,
  HardDrive,
  Globe,
  Lock
} from 'lucide-react';

type UploadFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  stage: number;
  uploadedAt: Date;
  error: string | null;
  progress: number;
};

const AuriVaultUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { organization } = useOrganization();

  // Mock processing states
  const processingStages = [
    { name: 'Uploading', icon: <Upload className="w-4 h-4" /> },
    { name: 'Extracting', icon: <FileText className="w-4 h-4" /> },
    { name: 'Chunking', icon: <HardDrive className="w-4 h-4" /> },
    { name: 'Embedding', icon: <Brain className="w-4 h-4" /> },
    { name: 'Indexing', icon: <Globe className="w-4 h-4" /> },
    { name: 'Complete', icon: <Check className="w-4 h-4" /> }
  ];

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-400" />;
      case 'txt':
        return <FileText className="w-8 h-8 text-gray-400" />;
      case 'csv':
        return <File className="w-8 h-8 text-green-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="w-8 h-8 text-purple-400" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const processedFiles: UploadFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      stage: 0,
      uploadedAt: new Date(),
      error: null,
      progress: 0
    }));

    setFiles((prev) => [...prev, ...processedFiles]);
    // Start upload for each file immediately
    processedFiles.forEach((f) => startUploadProcess(f));
  };

  const startUploadProcess = async (target: UploadFile) => {
    // Require organization selection
    if (!organization) {
      setFiles((prev) => prev.map((f) => (f.id === target.id ? { ...f, status: 'error', error: 'No organization selected. Use the org switcher.' } : f)));
      return;
    }
    setFiles((prev) => prev.map((f) => (f.id === target.id ? { ...f, status: 'uploading', error: null } : f)));

    // Simulate upload and processing
    for (let stage = 0; stage < processingStages.length; stage++) {
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (stage === 0) {
        try {
          const fd = new FormData();
          fd.append('file', target.file);
          const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
          if (!res.ok) {
            const data = await res.json().catch(() => ({} as any));
            throw new Error(data.error ?? 'Upload failed');
          }
        } catch (e) {
          const message = (e as Error).message;
          setFiles((prev) => prev.map((f) => (f.id === target.id ? { ...f, status: 'error', error: message } : f)));
          break;
        }
      }
      
      setFiles((prev) =>
        prev.map((f) =>
          f.id === target.id
            ? {
                ...f,
                stage,
                status: (stage === processingStages.length - 1 ? 'completed' : 'processing') as UploadFile['status'],
                progress: ((stage + 1) / processingStages.length) * 100,
              }
            : f,
        ),
      );
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const retryFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'pending', stage: 0, progress: 0, error: null } : f)),
    );
    const target = files.find((f) => f.id === fileId);
    if (target) startUploadProcess(target);
  };

  const getStatusColor = (status: UploadFile['status'], stage: number) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'uploading':
      case 'processing':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      default:
        return 'text-slate-400 border-slate-600 bg-slate-800/30';
    }
  };

  const getStatusText = (file: UploadFile) => {
    if (file.status === 'completed') return 'Ready';
    if (file.status === 'error') return 'Error';
    if (file.status === 'uploading' || file.status === 'processing') {
      return processingStages[file.stage]?.name || 'Processing';
    }
    return 'Pending';
  };

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Document Vault
              </h1>
              <p className="text-slate-400">Securely upload and process your knowledge documents</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{files.length}</div>
                  <div className="text-sm text-slate-400">Total Files</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{completedFiles}</div>
                  <div className="text-sm text-slate-400">Processed</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{formatFileSize(totalSize)}</div>
                  <div className="text-sm text-slate-400">Total Size</div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">AES-256</div>
                  <div className="text-sm text-slate-400">Encrypted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drag & Drop Zone */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.jpg,.jpeg,.png"
              />
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group ${
                  isDragging 
                    ? 'border-amber-500 bg-amber-500/5 scale-102' 
                    : 'border-slate-600 hover:border-amber-500/50 hover:bg-slate-800/20'
                }`}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative space-y-6">
                  <div className="flex justify-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
                      isDragging 
                        ? 'bg-amber-500 text-slate-900 scale-110' 
                        : 'bg-slate-800 text-slate-400 group-hover:bg-amber-500/20 group-hover:text-amber-400'
                    }`}>
                      <Upload className="w-10 h-10" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {isDragging ? 'Drop files here' : 'Upload Documents'}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Drag & drop files here or click to browse
                    </p>
                    <p className="text-sm text-slate-500">
                      Supports PDF, DOC, DOCX, TXT, CSV, JPG, PNG • Max 50MB per file
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {['PDF', 'DOCX', 'TXT', 'CSV', 'PNG'].map((format) => (
                      <span key={format} className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-400">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Upload Queue</h3>
                  <p className="text-sm text-slate-400">{files.length} files • {completedFiles} processed</p>
                </div>
                
                <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white truncate">
                              {file.name}
                            </h4>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-1 hover:bg-slate-700 rounded-md transition-colors"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-400">
                              {formatFileSize(file.size)}
                            </span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(file.status, file.stage)}`}>
                              <div className="flex items-center space-x-1">
                                {file.status === 'processing' || file.status === 'uploading' ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  processingStages[file.stage]?.icon || <Clock className="w-3 h-3" />
                                )}
                                <span>{getStatusText(file)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          {(file.status === 'uploading' || file.status === 'processing') && (
                            <div className="space-y-2">
                              <div className="w-full bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-amber-400 to-yellow-500 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                              
                              {/* Processing Stages */}
                              <div className="flex items-center space-x-1 overflow-x-auto">
                                {processingStages.map((stage, index) => (
                                  <div key={index} className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs whitespace-nowrap ${
                                    index <= file.stage 
                                      ? index === file.stage && file.status !== 'completed'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {React.cloneElement(stage.icon, { 
                                      className: `w-3 h-3 ${
                                        index === file.stage && file.status !== 'completed' ? 'animate-pulse' : ''
                                      }` 
                                    })}
                                    <span>{stage.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {file.status === 'error' && (
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>Upload failed</span>
                              </div>
                              <button
                                onClick={() => retryFile(file.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {file.status === 'completed' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                              <Eye className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                              <Download className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Processing Pipeline */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Processing Pipeline
              </h3>
              <div className="space-y-3">
                {processingStages.slice(0, -1).map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      {stage.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{stage.name}</p>
                      <p className="text-xs text-slate-400">
                        {index === 0 && 'Secure file transfer'}
                        {index === 1 && 'Text & image extraction'}
                        {index === 2 && 'Smart content chunking'}
                        {index === 3 && 'AI vector embeddings'}
                        {index === 4 && 'Search index creation'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Security Features
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">End-to-end Encryption</p>
                    <p className="text-xs text-slate-400">AES-256 encryption at rest and in transit</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Tenant Isolation</p>
                    <p className="text-xs text-slate-400">Complete data separation per organization</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">GDPR Compliant</p>
                    <p className="text-xs text-slate-400">Full audit logs and data control</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300">Processing Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Success Rate</span>
                  <span className="text-sm font-medium text-emerald-400">99.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Avg Process Time</span>
                  <span className="text-sm font-medium text-blue-400">2.3s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Storage Used</span>
                  <span className="text-sm font-medium text-amber-400">2.4 GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Queries Available</span>
                  <span className="text-sm font-medium text-purple-400">∞</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-300">Pro Tips</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Better OCR:</strong> Upload high-resolution images for better text extraction
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Faster Processing:</strong> PDFs with text layers process 10x faster than scanned images
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Better Results:</strong> Well-structured documents with clear headings improve search accuracy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuriVaultUpload;