"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { SignedIn, SignedOut, useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  Calendar,
  User,
  HardDrive,
  Brain,
  Shield,
  Sparkles,
  MoreHorizontal,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DocumentsPage() {
  const { data, refetch, isFetching } = api.documents.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const { organization } = useOrganization();
  const router = useRouter();

  // Filter documents based on search and status
  const filteredDocuments = data?.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "processed" && doc.status === "processed") ||
                         (filterStatus === "processing" && doc.status === "processing");
    return matchesSearch && matchesFilter;
  }) || [];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "processed":
        return { 
          icon: <CheckCircle className="w-4 h-4" />, 
          text: "Ready", 
          className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
        };
      case "processing":
        return { 
          icon: <Clock className="w-4 h-4 animate-pulse" />, 
          text: "Processing", 
          className: "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
        };
      case "error":
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          text: "Error", 
          className: "bg-red-500/20 text-red-400 border border-red-500/30" 
        };
      default:
        return { 
          icon: <Clock className="w-4 h-4" />, 
          text: "Pending", 
          className: "bg-slate-500/20 text-slate-400 border border-slate-500/30" 
        };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleUploadClick = () => {
    router.push("/documents/upload");
  };

  const processedCount = data?.filter(d => d.status === "processed").length || 0;
  const totalSize = data?.reduce((acc, doc) => acc + (doc.size || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <SignedOut>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-slate-900" />
              </div>
              <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
              <p className="text-slate-400 mb-6">Please sign in to access your document vault.</p>
              <Link 
                href="/sign-in" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <span>Sign In</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Organization Warning */}
          {!organization && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-amber-300 font-medium">No Organization Selected</p>
                  <p className="text-amber-400/80 text-sm">Use the organization switcher in the navbar before uploading documents.</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    Document Vault
                  </h1>
                  <p className="text-slate-400">Manage your AI-powered knowledge base</p>
                </div>
              </div>

              <button
                onClick={handleUploadClick}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Documents</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{data?.length || 0}</div>
                    <div className="text-sm text-slate-400">Total Documents</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{processedCount}</div>
                    <div className="text-sm text-slate-400">Ready to Query</div>
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
                    <div className="text-sm text-slate-400">Storage Used</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">AI Ready</div>
                    <div className="text-sm text-slate-400">Intelligent Search</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Documents</option>
                <option value="processed">Ready</option>
                <option value="processing">Processing</option>
              </select>

              <button className="flex items-center space-x-2 px-4 py-3 bg-slate-800/50 border border-slate-600 hover:border-slate-500 rounded-xl text-slate-300 hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-300 font-medium">Error</p>
                  <p className="text-red-400/80 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents List */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
            {isFetching ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-400">Loading documents...</span>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center p-12">
                {data?.length === 0 ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Documents Yet</h3>
                      <p className="text-slate-400 mb-6">Upload your first document to get started with AI-powered insights.</p>
                      <button
                        onClick={handleUploadClick}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Upload Your First Document</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
                      <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
                      <p className="text-slate-400">Try adjusting your search or filter criteria.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredDocuments.map((doc) => {
                  const statusInfo = getStatusInfo(doc.status || "pending");
                  
                  return (
                    <div key={doc.id} className="p-6 hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                              {doc.title}
                            </h4>
                            <p className="text-sm text-slate-400 truncate">
                              {doc.filename}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(doc.createdAt)}</span>
                              </div>
                              {doc.size && (
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <HardDrive className="w-3 h-3" />
                                  <span>{formatFileSize(doc.size)}</span>
                                </div>
                              )}
                              {doc.author && (
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <User className="w-3 h-3" />
                                  <span>{doc.author}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusInfo.className}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.text}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <Download className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                            <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {data && data.length > 0 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleUploadClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-slate-800/50 border border-slate-600 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-xl text-slate-300 hover:text-amber-300 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add More Documents</span>
                </button>

                <Link
                  href="/chat"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask AI Assistant</span>
                </Link>
              </div>
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  );
}