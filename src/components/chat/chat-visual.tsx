'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';
import { type VisualMetadata, isBarChartData, isPieChartData, isTableData } from '@/lib/ai/visual-types';
import type { BarChartData, LineChartData, PieChartData, TableData } from '@/lib/ai/visual-types';
import { ChatTable } from './visuals/chat-table';

const ChatBarChart = dynamic(() => import('./visuals/chat-bar-chart').then((m) => m.ChatBarChart), { ssr: false });
const ChatPieChart = dynamic(() => import('./visuals/chat-pie-chart').then((m) => m.ChatPieChart), { ssr: false });
const ChatLineChart = dynamic(() => import('./visuals/chat-line-chart').then((m) => m.ChatLineChart), { ssr: false });

interface ChatVisualProps {
  visual: VisualMetadata;
}

export const ChatVisual = memo(function ChatVisual({ visual }: ChatVisualProps) {
  if (visual.type === 'bar' && Array.isArray(visual.data) && isBarChartData(visual.data)) {
    return <ChatBarChart data={visual.data as BarChartData[]} title={visual.title} />;
  }

  if (visual.type === 'pie' && Array.isArray(visual.data) && isPieChartData(visual.data)) {
    return <ChatPieChart data={visual.data as PieChartData[]} title={visual.title} />;
  }

  if (visual.type === 'line' && Array.isArray(visual.data) && isBarChartData(visual.data)) {
    return <ChatLineChart data={visual.data as LineChartData[]} title={visual.title} />;
  }

  if (visual.type === 'table' && isTableData(visual.data)) {
    return <ChatTable data={visual.data as TableData} title={visual.title} />;
  }

  // Fallback: render data as text
  return (
    <div className="my-2 rounded border bg-muted/50 p-2 text-xs">
      <p className="font-medium">{visual.title}</p>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(visual.data, null, 2)}</pre>
    </div>
  );
});
