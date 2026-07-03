import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { ActivityLog } from '../types';

interface LogsViewProps {
  logs: ActivityLog[];
  onRefresh: () => void;
  onClear: () => void;
}

export default function LogsView({ logs, onRefresh, onClear }: LogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-[#EAEAEA]">
      {/* Header */}
      <div className="border-b border-[#333333] pb-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="font-syne font-extrabold text-4xl text-white uppercase tracking-tighter flex items-center space-x-3">
            <Activity className="w-6 h-6 text-[#00FF9D]" />
            <span>Active Dispatch Logs</span>
          </h1>
          <p className="text-xs text-[#8A8782] mt-1.5 font-mono uppercase tracking-wider">
            Audit trailing publish checks, upload actions, connection diagnostic signals, and local background crons.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="p-3 bg-transparent hover:border-[#00FF9D] hover:text-[#00FF9D] text-[#EAEAEA] rounded-none border border-[#444] transition-all cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="px-4 py-3 bg-transparent hover:bg-[#FF5F57]/10 text-[#FF5F57] rounded-none border border-[#FF5F57]/40 hover:border-[#FF5F57] text-xs font-mono font-bold uppercase tracking-widest flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8A8782] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH LOG MESSAGES, PARAMETERS, OR TRACES..."
            className="w-full bg-[#1A1A1C] border border-[#333333] pl-11 pr-4 py-3 text-xs text-[#EAEAEA] placeholder-[#5A5A5C] focus:outline-none focus:border-[#00FF9D] font-mono uppercase tracking-wider"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center bg-[#1A1A1C] border border-[#333333] p-1 rounded-none shrink-0 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all border ${
              filterType === 'all' ? 'border-[#00FF9D] text-[#00FF9D]' : 'border-transparent text-[#8A8782] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('success')}
            className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all border ${
              filterType === 'success' ? 'border-[#00FF9D] text-[#00FF9D]' : 'border-transparent text-[#8A8782] hover:text-[#00FF9D]'
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilterType('info')}
            className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all border ${
              filterType === 'info' ? 'border-blue-400 text-blue-400' : 'border-transparent text-[#8A8782] hover:text-blue-400'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all border ${
              filterType === 'warning' ? 'border-amber-500 text-amber-500' : 'border-transparent text-[#8A8782] hover:text-amber-500'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilterType('error')}
            className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-widest cursor-pointer transition-all border ${
              filterType === 'error' ? 'border-[#FF5F57] text-[#FF5F57]' : 'border-transparent text-[#8A8782] hover:text-[#FF5F57]'
            }`}
          >
            Error
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-[#1A1A1C] border border-[#333333] rounded-none overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto divide-y divide-[#333333]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-5 flex items-start space-x-4 hover:bg-[#111113]/50 transition-colors">
              {/* Type Icon */}
              <div className="shrink-0 mt-0.5">
                {log.type === 'success' && <CheckCircle className="w-4 h-4 text-[#00FF9D]" />}
                {log.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {log.type === 'error' && <AlertCircle className="w-4 h-4 text-[#FF5F57]" />}
              </div>

              {/* Message Details */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-mono uppercase">
                  <span className={`font-bold tracking-widest ${
                    log.type === 'success' ? 'text-[#00FF9D]' :
                    log.type === 'error' ? 'text-[#FF5F57]' :
                    log.type === 'warning' ? 'text-amber-500' : 'text-blue-400'
                  }`}>
                    {log.type} Event
                  </span>
                  <span className="text-[#8A8782] text-[10px] tracking-wider mt-1 sm:mt-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed font-sans font-medium">{log.message}</p>
                {log.details && (
                  <div className="p-4 bg-[#111113] border border-[#333333] rounded-none text-[10px] text-[#A0A0A0] font-mono whitespace-pre-wrap break-all leading-normal uppercase">
                    {log.details}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-16 text-center text-[#8A8782] space-y-2">
              <p className="font-mono uppercase tracking-widest text-white">No matching logs found in this category.</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-[#666]">Try modifying your filter options or search query above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
