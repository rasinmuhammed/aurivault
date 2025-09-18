'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from "~/trpc/react";
import { useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Send, 
  Sparkles, 
  Shield, 
  Copy, 
  RotateCcw, 
  FileText, 
  Brain,
  Zap,
  MessageCircle,
  Quote,
  ExternalLink,
  Clock,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  Bot,
  User,
  Upload
} from 'lucide-react';

type Citation = { 
  documentId: string; 
  chunkId: string; 
  similarity: number;
  content: string;
  metadata: Record<string, any>;
};

type Message = {
  id: number;
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number | null;
  citations?: Citation[];
  processingTime?: number;
  error?: boolean;
};

const AuriVaultChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  
  const { organization } = useOrganization();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // API hooks
  const askMutation = api.rag.ask.useMutation({
    onSuccess: (data) => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        confidence: data.confidence,
        citations: data.citations,
        processingTime: data.processingTimeMs,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Sorry, I encountered an error while processing your question.';
      const errResponse: Message = {
        id: Date.now() + 2,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errResponse]);
      setIsTyping(false);
    },
  });

  const healthQuery = api.rag.healthCheck.useQuery(undefined, {
    onSuccess: (data) => {
      setSystemReady(data.status === 'healthy');
    },
    onError: () => {
      setSystemReady(false);
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const suggestionsQuery = api.rag.getSuggestions.useQuery();
  const analyticsQuery = api.rag.getAnalytics.useQuery({ days: 7 });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with system message
  useEffect(() => {
    if (organization && systemReady === true && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'system',
        content: `Welcome to AuriVault! I'm powered by Llama 3.1 70B via Groq for lightning-fast responses. I can help you find insights from your ${organization.name} documents with cited, accurate answers. What would you like to know?`,
        timestamp: new Date(),
        confidence: null
      }]);
    }
  }, [organization, systemReady, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Build chat history for context
    const chatHistory = messages
      .filter(m => m.type !== 'system')
      .slice(-6) // Keep last 6 messages for context
      .map(m => ({
        role: m.type as 'user' | 'assistant',
        content: m.content
      }));

    askMutation.mutate({ 
      question: userMessage.content,
      chatHistory 
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    if (inputRef.current) inputRef.current.focus();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const retryMessage = (messageId: number) => {
    const message = messages.find(m => m.id === messageId - 1); // Find the user message before the failed one
    if (message && message.type === 'user') {
      // Remove the failed assistant message
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setInputValue(message.content);
    }
  };

  // System status indicator
  const getStatusIndicator = () => {
    if (systemReady === null) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm border border-amber-500/30">
          <Loader2 className="w-2 h-2 animate-spin" />
          <span>Checking...</span>
        </div>
      );
    }
    if (systemReady) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>AI Online</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30">
        <AlertCircle className="w-2 h-2" />
        <span>AI Offline</span>
      </div>
    );
  };

  if (!organization) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">No Organization Selected</h2>
          <p className="text-slate-400">Please select an organization to continue chatting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-xl bg-slate-900/50 border-b border-slate-700 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center relative">
              <Brain className="w-6 h-6 text-slate-900" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 blur-lg opacity-50 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                AuriVault Assistant
              </h1>
              <p className="text-sm text-slate-400">
                Powered by Llama 3.1 70B • {organization.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusIndicator()}
            <div className="text-right">
              <div className="text-sm font-medium">
                {suggestionsQuery.data?.documentCount || 0} Documents
              </div>
              <div className="text-xs text-slate-400">Ready to query</div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-6 flex">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {/* No documents warning */}
              {suggestionsQuery.data?.documentCount === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center">
                  <Upload className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-amber-300 mb-2">No Documents Found</h3>
                  <p className="text-amber-400/80 mb-4">
                    Upload some documents first to start asking questions about your knowledge base.
                  </p>
                  <Link 
                    href="/documents/upload"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Documents</span>
                  </Link>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-slate-700' 
                        : message.type === 'system'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : message.error
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-gradient-to-br from-amber-400 to-yellow-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : message.type === 'system' ? (
                        <MessageCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-slate-900" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl p-4 max-w-full ${
                        message.type === 'user'
                          ? 'bg-slate-800 rounded-br-none'
                          : message.type === 'system'
                          ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-bl-none'
                          : message.error
                          ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-bl-none'
                          : 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-bl-none'
                      }`}>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-white whitespace-pre-line m-0 leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Citations */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-amber-300">
                              <Shield className="w-3 h-3" />
                              <span>Sources ({message.citations.length}):</span>
                            </div>
                            {message.citations.slice(0, 3).map((citation, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-xs text-slate-300 truncate block">
                                      {citation.metadata?.documentTitle || 'Document'}
                                    </span>
                                    <span className="text-xs text-slate-500 truncate block">
                                      {citation.content.slice(0, 60)}...
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  <span className="text-xs text-emerald-400">
                                    {Math.round(citation.similarity * 100)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                            {message.citations.length > 3 && (
                              <p className="text-xs text-slate-400 text-center">
                                +{message.citations.length - 3} more sources
                              </p>
                            )}
                          </div>
                        )}

                        {/* Message Actions */}
                        {message.type === 'assistant' && (
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => copyMessage(message.content)}
                                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                                title="Copy message"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              {message.error && (
                                <button 
                                  onClick={() => retryMessage(message.id)}
                                  className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                                  title="Retry"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {message.confidence && (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${message.confidence >= 80 ? 'bg-emerald-400' : message.confidence >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} />
                                  <span className="text-xs text-slate-400">{message.confidence}% confident</span>
                                </div>
                              )}
                              {message.processingTime && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-500">{message.processingTime}ms</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 px-2">
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center relative">
                      <Bot className="w-5 h-5 text-slate-900" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 animate-ping opacity-30" />
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl rounded-bl-none p-4">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-amber-300 text-sm">Thinking with Llama 3.1...</span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-6 space-y-4">
              {/* Suggestions */}
              {messages.length <= 1 && suggestionsQuery.data?.suggestions && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Try asking me about:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestionsQuery.data.suggestions.slice(0, 4).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={!systemReady}
                        className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-sm text-slate-300 hover:text-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-2">
                          <Quote className="w-3 h-3 text-amber-400 group-hover:text-amber-300" />
                          <span>{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Bar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl blur-xl" />
                <div className="relative flex items-end space-x-3 p-4 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl">
                  <div className="flex-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={systemReady ? "Ask me anything about your documents..." : "AI system is starting up..."}
                      disabled={!systemReady || isTyping}
                      className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none max-h-32 min-h-[24px] disabled:opacity-50"
                      rows={1}
                      style={{ height: 'auto' }}
                      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping || !systemReady}
                      className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>End-to-end encrypted</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Powered by Groq</span>
                  </div>
                </div>
                <div className="text-slate-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 ml-6 space-y-6">
            {/* System Status */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">AI Model</span>
                  <span className="text-sm font-medium text-white">
                    {healthQuery.data?.groqModel || 'Llama 3.1 70B'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <span className={`text-sm font-medium ${systemReady ? 'text-emerald-400' : 'text-red-400'}`}>
                    {systemReady ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Documents</span>
                  <span className="text-sm font-medium text-blue-400">
                    {suggestionsQuery.data?.documentCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Response Speed</span>
                  <span className="text-sm font-medium text-purple-400">~2-4s</span>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            {analyticsQuery.data && (
              <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Session Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Total Queries</span>
                    <span className="text-sm font-medium text-white">
                      {messages.filter(m => m.type === 'user').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg Confidence</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {analyticsQuery.data.avgConfidence}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg Sources</span>
                    <span className="text-sm font-medium text-blue-400">
                      {analyticsQuery.data.avgSources}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Week Total</span>
                    <span className="text-sm font-medium text-purple-400">
                      {analyticsQuery.data.totalQueries}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Documents */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Knowledge Sources
              </h3>
              <div className="space-y-3">
                {suggestionsQuery.data?.documentCount ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            {suggestionsQuery.data.documentCount} Documents Ready
                          </p>
                          <p className="text-xs text-slate-400">
                            Searchable via vector embeddings
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <Link
                        href="/documents"
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        View all documents →
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 mb-3">No documents uploaded</p>
                    <Link
                      href="/documents/upload"
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Now</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setMessages([])}
                  className="w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Clear chat history
                </button>
                <Link
                  href="/documents/upload"
                  className="block w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Upload more documents
                </Link>
                <Link
                  href="/documents"
                  className="block w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Manage documents
                </Link>
              </div>
            </div>

            {/* AI Model Info */}
            <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-300">Powered by Groq</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Lightning Fast:</strong> Groq's LPU delivers responses in ~2-4 seconds
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">High Quality:</strong> Llama 3.1 70B provides accurate, contextual responses
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0 mt-2" />
                  <p className="text-slate-300">
                    <strong className="text-amber-300">Cost Effective:</strong> ~10x cheaper than GPT-4 with similar performance
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

export default AuriVaultChat;