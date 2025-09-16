import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  MessageCircle, 
  Search, 
  Sparkles, 
  Shield, 
  Users, 
  BarChart3,
  Settings,
  Bell,
  Plus,
  ArrowRight,
  Zap,
  Eye,
  Download,
  Filter,
  TrendingUp,
  Brain,
  Lock
} from 'lucide-react';

const AuriVaultDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mock data
  const documents = [
    { id: 1, name: 'Q4 Financial Report.pdf', size: '2.3 MB', uploaded: '2 hours ago', status: 'processed' },
    { id: 2, name: 'Product Roadmap 2024.docx', size: '1.8 MB', uploaded: '1 day ago', status: 'processing' },
    { id: 3, name: 'Customer Feedback Analysis.txt', size: '0.5 MB', uploaded: '3 days ago', status: 'processed' },
    { id: 4, name: 'Market Research Data.csv', size: '4.1 MB', uploaded: '1 week ago', status: 'processed' }
  ];

  const recentQueries = [
    { id: 1, query: 'What are our top customer complaints?', confidence: 95, time: '5 min ago' },
    { id: 2, query: 'Show me revenue trends for Q4', confidence: 89, time: '1 hour ago' },
    { id: 3, query: 'Product feature requests analysis', confidence: 92, time: '2 hours ago' }
  ];

  const stats = [
    { label: 'Documents', value: '127', change: '+12%', icon: <FileText className="w-5 h-5" /> },
    { label: 'Queries Today', value: '43', change: '+8%', icon: <MessageCircle className="w-5 h-5" /> },
    { label: 'Avg Confidence', value: '94%', change: '+2%', icon: <Brain className="w-5 h-5" /> },
    { label: 'Response Time', value: '0.3s', change: '-15%', icon: <Zap className="w-5 h-5" /> }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        setIsUploading(false);
      }, 3000);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
      }, 2000);
    }
  };

  const NavigationTab = ({ id, label, icon, isActive, onClick }: { id: string; label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="backdrop-blur-xl bg-slate-900/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  AuriVault
                </span>
              </div>
              <div className="h-8 w-px bg-slate-600" />
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Shield className="w-4 h-4" />
                <span>Organization: Acme Corp</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
              </button>
              <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-64 space-y-2">
          <NavigationTab
            id="overview"
            label="Overview"
            icon={<BarChart3 className="w-5 h-5" />}
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <NavigationTab
            id="documents"
            label="Documents"
            icon={<FileText className="w-5 h-5" />}
            isActive={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
          />
          <NavigationTab
            id="chat"
            label="AI Assistant"
            icon={<MessageCircle className="w-5 h-5" />}
            isActive={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <NavigationTab
            id="analytics"
            label="Analytics"
            icon={<TrendingUp className="w-5 h-5" />}
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <NavigationTab
            id="team"
            label="Team"
            icon={<Users className="w-5 h-5" />}
            isActive={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-slate-900/50 backdrop-blur border border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 flex items-center justify-center">
                          {stat.icon}
                        </div>
                        <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 text-amber-400 mr-2" />
                    Quick Upload
                  </h3>
                  <div 
                    className="border-2 border-dashed border-slate-600 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 mx-auto bg-amber-500 rounded-full flex items-center justify-center animate-spin">
                          <Upload className="w-6 h-6 text-slate-900" />
                        </div>
                        <p className="text-amber-400">Processing documents...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-12 h-12 mx-auto bg-slate-700 group-hover:bg-amber-500 rounded-full flex items-center justify-center transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 group-hover:text-white">Drop files here or click to upload</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Brain className="w-5 h-5 text-amber-400 mr-2" />
                    Ask Anything
                  </h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What insights do you need?"
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button 
                        onClick={handleSearch}
                        disabled={isSearching || !query.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50"
                      >
                        {isSearching ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                      </button>
                    </div>
                    {isSearching && (
                      <div className="text-amber-400 text-sm flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                        Illuminating your knowledge...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Recent Queries</h3>
                  <button className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {recentQueries.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.query}</p>
                        <p className="text-sm text-slate-400 mt-1">{item.time}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${item.confidence >= 90 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-sm font-medium">{item.confidence}%</span>
                        </div>
                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Document Vault</h2>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Your Documents</h3>
                    <span className="text-sm text-slate-400">{documents.length} files</span>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-700">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-6 hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white group-hover:text-amber-300 transition-colors">{doc.name}</h4>
                            <p className="text-sm text-slate-400 mt-1">
                              {doc.size} • Uploaded {doc.uploaded}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'processed' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {doc.status === 'processed' ? 'Ready' : 'Processing...'}
                          </div>
                          <button className="p-2 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center">
                  <Brain className="w-8 h-8 text-amber-400 mr-3" />
                  AI Assistant
                </h2>
                <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Online</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl h-[600px] flex flex-col">
                    <div className="p-6 border-b border-slate-700">
                      <h3 className="font-semibold text-amber-300">Ask me anything about your documents</h3>
                      <p className="text-sm text-slate-400 mt-1">I'll provide cited, intelligent responses</p>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                      {/* Sample conversation */}
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium">You</span>
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 max-w-md">
                          <p className="text-white">What are our main revenue drivers this quarter?</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-slate-900" />
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl rounded-tl-none p-4 max-w-2xl">
                          <p className="text-white mb-3">Based on your Q4 Financial Report, the main revenue drivers this quarter are:</p>
                          <ul className="space-y-2 text-white mb-4">
                            <li>• <strong>Product Sales:</strong> $2.3M (45% of total revenue)</li>
                            <li>• <strong>Subscription Services:</strong> $1.8M (35% of total revenue)</li>
                            <li>• <strong>Professional Services:</strong> $1.0M (20% of total revenue)</li>
                          </ul>
                          <div className="flex items-center space-x-2 text-xs text-amber-300">
                            <Shield className="w-3 h-3" />
                            <span>Cited from: Q4_Financial_Report.pdf, pages 12-15</span>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                            <span>95% confidence</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t border-slate-700">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Ask about your documents..."
                          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                        />
                        <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg transition-all">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 text-amber-300">Suggested Questions</h3>
                    <div className="space-y-3">
                      {[
                        'Summarize key findings from recent reports',
                        'What are our biggest customer pain points?',
                        'Show me competitive analysis insights',
                        'Analyze trends in customer feedback'
                      ].map((suggestion, index) => (
                        <button key={index} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 text-amber-300">Knowledge Sources</h3>
                    <div className="space-y-3">
                      {documents.filter(d => d.status === 'processed').map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                          <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                          <span className="text-sm text-slate-300 truncate">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Knowledge Analytics</h2>
                <div className="flex items-center space-x-3">
                  <select className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                  </select>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Query Trends Chart */}
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6">Query Volume Trends</h3>
                    <div className="h-64 bg-slate-800/50 rounded-xl flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Interactive chart visualization would go here</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Queries */}
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6">Most Asked Questions</h3>
                    <div className="space-y-4">
                      {[
                        { query: 'What are our revenue trends?', count: 47, confidence: 94 },
                        { query: 'Show customer satisfaction metrics', count: 32, confidence: 91 },
                        { query: 'Analyze competitor positioning', count: 28, confidence: 89 },
                        { query: 'Product roadmap priorities', count: 23, confidence: 93 }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                          <div>
                            <p className="text-white font-medium">{item.query}</p>
                            <p className="text-sm text-slate-400">Asked {item.count} times</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-emerald-400">{item.confidence}%</div>
                              <div className="text-xs text-slate-400">avg confidence</div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/20 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-amber-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Knowledge Gaps */}
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Knowledge Gaps
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full" />
                          <span className="text-sm font-medium text-red-400">High Priority</span>
                        </div>
                        <p className="text-sm text-slate-300">Marketing strategy documents missing</p>
                      </div>
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full" />
                          <span className="text-sm font-medium text-amber-400">Medium Priority</span>
                        </div>
                        <p className="text-sm text-slate-300">Q1 planning docs need updates</p>
                      </div>
                    </div>
                  </div>

                  {/* Document Health */}
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 text-amber-300">Document Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Processed</span>
                        <span className="text-sm font-medium text-emerald-400">89%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '89%' }} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Indexed</span>
                        <span className="text-sm font-medium text-blue-400">94%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '94%' }} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Queryable</span>
                        <span className="text-sm font-medium text-amber-400">97%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-amber-400 h-2 rounded-full" style={{ width: '97%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuriVaultDashboard;