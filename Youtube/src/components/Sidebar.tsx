// Youtube/src/components/Sidebar.tsx
import Link from 'next/link';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Download, Video } from 'lucide-react';
import { useUser } from '@/lib/AuthContext';

export default function Sidebar() {
  const { user } = useUser();

  const generateRandomRoom = () => {
    // Generates a random room string (e.g., room-8f72a)
    return `room-${Math.random().toString(36).substring(2, 7)}`;
  };

  const mainLinks = [
    { icon: <Home size={22} />, label: 'Home', path: '/' },
    { icon: <Compass size={22} />, label: 'Explore', path: '/search' },
    { icon: <PlaySquare size={22} />, label: 'Subscriptions', path: '/subscriptions' },
  ];

  const userLinks = [
    { icon: <History size={22} />, label: 'History', path: '/history' },
    { icon: <Clock size={22} />, label: 'Watch Later', path: '/watch-later' },
    { icon: <ThumbsUp size={22} />, label: 'Liked Videos', path: '/liked' },
    // 👇 NEW: Downloads Page Link
    { icon: <Download size={22} />, label: 'My Downloads', path: '/downloads' }, 
  ];

  return (
    <aside className="w-64 hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-border bg-background p-4 overflow-y-auto">
      
      <div className="space-y-1 mb-6">
        {mainLinks.map((link) => (
          <Link href={link.path} key={link.label}>
            <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium">
              {link.icon}
              {link.label}
            </div>
          </Link>
        ))}
      </div>

      <hr className="border-border mb-4" />

      {/* Live VoIP Feature Button */}
      <div className="mb-6">
        <h3 className="px-3 mb-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">Features</h3>
        <Link href="/call">
          <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold">
            <Video size={22} className="animate-pulse" />
            Live Video Call
          </div>
        </Link>
      </div>

      <hr className="border-border mb-4" />

      {user ? (
        <div className="space-y-1">
          <h3 className="px-3 mb-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">You</h3>
          {userLinks.map((link) => (
            <Link href={link.path} key={link.label}>
              <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium">
                {link.icon}
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          Sign in to like videos, comment, and subscribe.
        </div>
      )}

    </aside>
  );
}