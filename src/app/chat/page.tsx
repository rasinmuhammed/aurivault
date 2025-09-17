'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from "~/trpc/react";
import { 
  Send, 
  Sparkles, 
  Shield, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  FileText, 
  Brain,
  Zap,
  MessageCircle,
  Quote,
  ExternalLink,
  Clock,
  TrendingUp,
  Star
} from 'lucide-react';

type Citation = { document: string; pages: string; relevance: number };
type Message = {
  id: number;
  type: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number | null;
  citations?: Citation[];
  processingTime?: number;
};

const AuriVaultChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'system',
      content: "Welcome to AuriVault! I'm your AI knowledge assistant. I can help you find insights from your uploaded documents with cited, accurate responses. What would you like to know?",
      timestamp: new Date(Date.now() - 300000),
      confidence: null
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const ask = api.rag.ask.useMutation({
    onSuccess: (data, variables) => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        confidence: null,
        citations: data.citations?.map((c) => ({ document: c.documentId, pages: c.chunkId, relevance: 1 })) ?? [],
        processingTime: undefined,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    },
    onError: () => {
      const errResponse: Message = {
        id: Date.now() + 2,
        type: 'assistant',
        content: 'Sorry, I could not retrieve an answer right now.',
        timestamp: new Date(),
      } as Message;
      setMessages((prev) => [...prev, errResponse]);
      setIsTyping(false);
    },
  });
  const [suggestions] = useState([
    "Summarize our Q4 financial performance",
    "What are the main customer pain points?",
    "Show me trends in user feedback",
    "Analyze competitor positioning from our research"
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    ask.mutate({ question: userMessage.content });
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
    // Could add toast notification here
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-xl panel p-6 border-b-0">
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
              <p className="text-sm text-slate-400">Illuminating your knowledge, securely</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">127 Documents</div>
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
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3xl flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-slate-700' 
                        : message.type === 'system'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-gradient-to-br from-amber-400 to-yellow-600'
                    }`}>
                      {message.type === 'user' ? (
                        <span className="text-sm font-medium">You</span>
                      ) : message.type === 'system' ? (
                        <MessageCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-slate-900" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex flex-col space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl p-4 max-w-full ${
                        message.type === 'user'
                          ? 'bg-slate-800 rounded-br-none'
                          : message.type === 'system'
                          ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-bl-none'
                          : 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-bl-none'
                      }`}>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-white whitespace-pre-line m-0 leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Citations */}
                        {message.citations && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-amber-300">
                              <Shield className="w-3 h-3" />
                              <span>Sources:</span>
                            </div>
                            {message.citations.map((citation, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs text-slate-300">{citation.document}</span>
                                  <span className="text-xs text-slate-500">pages {citation.pages}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  <span className="text-xs text-emerald-400">{Math.round(citation.relevance * 100)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Actions */}
                        {message.type === 'assistant' && (
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => copyMessage(message.content)}
                                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                              <button className="p-1.5 hover:bg-slate-700 rounded-md transition-colors">
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-3">
                              {message.confidence && (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${message.confidence >= 90 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
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
                      <Brain className="w-5 h-5 text-slate-900" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 animate-ping opacity-30" />
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl rounded-bl-none p-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="text-amber-300 text-sm">Illuminating your knowledge...</span>
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
              {messages.length <= 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Try asking me about:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-sm text-slate-300 hover:text-white transition-all group"
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
                      placeholder="Ask me anything about your documents..."
                      className="w-full bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none max-h-32 min-h-[24px]"
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
                      disabled={!inputValue.trim() || isTyping}
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
                    <span>Powered by AuriVault AI</span>
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
            {/* Session Stats */}
            <div className="panel p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Session Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Queries</span>
                  <span className="text-sm font-medium text-white">{messages.filter(m => m.type === 'user').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Avg Confidence</span>
                  <span className="text-sm font-medium text-emerald-400">
                    {messages.filter(m => typeof m.confidence === 'number').length > 0 
                      ? Math.round(messages.filter(m => typeof m.confidence === 'number').reduce((sum, m) => sum + (m.confidence || 0), 0) / messages.filter(m => typeof m.confidence === 'number').length)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Avg Response</span>
                  <span className="text-sm font-medium text-blue-400">
                    {messages.filter(m => typeof m.processingTime === 'number').length > 0
                      ? Math.round(messages.filter(m => typeof m.processingTime === 'number').reduce((sum, m) => sum + (m.processingTime || 0), 0) / messages.filter(m => typeof m.processingTime === 'number').length)
                      : 0}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Knowledge Sources */}
            <div className="panel p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Knowledge Sources
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Q4_Financial_Report.pdf', queries: 12, confidence: 94 },
                  { name: 'Customer_Feedback_Analysis.docx', queries: 8, confidence: 91 },
                  { name: 'Market_Research_Data.csv', queries: 5, confidence: 89 },
                  { name: 'Product_Roadmap_2024.docx', queries: 3, confidence: 92 }
                ].map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                          {source.name.split('.')[0]}
                        </p>
                        <p className="text-xs text-slate-400">
                          {source.queries} queries • {source.confidence}% avg
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-amber-300 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
                  Export conversation
                </button>
                <button className="w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
                  Clear chat history
                </button>
                <button className="w-full text-left p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
                  Provide feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuriVaultChat;