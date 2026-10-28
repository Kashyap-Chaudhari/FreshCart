'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = () => {
    setIsLoading(true);
    api.adminGetAuditLogs().then((res) => {
      if (res.success && res.data) setLogs(res.data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Security & Operational Audit Logs</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
              Owner Only
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable tracking of all admin actions, inventory edits, order cancellations, and setting modifications
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 rounded-xl"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Details / Changes</th>
              <th className="py-3 px-4 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">Loading audit trail...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">No audit log entries recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/60">
                  <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-900 block">{log.user?.name || 'System / Auto'}</span>
                    <span className="text-[10px] text-gray-400">{log.user?.role || ''}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{log.action}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-700">{log.entity}</td>
                  <td className="py-3.5 px-4">
                    <pre className="text-[10px] bg-gray-50 p-1.5 rounded-lg border border-gray-100 font-mono max-w-xs truncate text-gray-600">
                      {JSON.stringify(log.details)}
                    </pre>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-gray-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
