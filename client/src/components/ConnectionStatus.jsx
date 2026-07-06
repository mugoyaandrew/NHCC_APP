import { Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function ConnectionStatus() {
  const { connected } = useSocket();

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg transition-all duration-300 ${connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
      {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      {connected ? 'Live' : 'Offline'}
    </div>
  );
}
