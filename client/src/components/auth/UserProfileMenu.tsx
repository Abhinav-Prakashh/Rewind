import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface UserProfileMenuProps {
  onDisconnectWorkspace?: () => void;
  workspaceName?: string;
}

export function UserProfileMenu({ onDisconnectWorkspace, workspaceName }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Log user_metadata to console for verification
  useEffect(() => {
    if (user) {
      console.log('UserProfileMenu user.user_metadata:', user.user_metadata);
    }
  }, [user]);

  // Close on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Extract display name according to required fallback order:
  // 1. user.user_metadata.full_name
  // 2. user.user_metadata.name
  // 3. user.email before the @ symbol
  // 4. "User"
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'User';

  // Extract avatar according to required fallback order:
  // 1. user.user_metadata.avatar_url
  // 2. user.user_metadata.picture
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  const email = user?.email || null;
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Logo / Avatar Button (Circle format) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={displayName}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${
          isOpen
            ? 'ring-2 ring-accent ring-offset-2 ring-offset-ink'
            : 'hover:ring-2 hover:ring-white/30'
        }`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-accent text-accent-ink font-semibold text-sm flex items-center justify-center shadow-xs">
            {initial}
          </div>
        )}

        {/* Online Indicator Dot */}
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-ink" />
      </button>

      {/* Profile & Logout Popover Menu */}
      {isOpen && (
        <div className="fixed md:absolute left-4 md:left-[76px] bottom-20 md:bottom-0 w-72 bg-surface-raised rounded-[24px] p-4 border border-border-strong shadow-2xl z-50 text-ink animate-fade-up">
          {/* User Profile Header */}
          <div className="flex items-center gap-3 p-2.5 bg-surface rounded-[18px] border border-border mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-ink text-accent font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate leading-snug">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-muted truncate font-mono">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Workspace Details */}
          {workspaceName && (
            <div className="px-2 py-1 mb-2 space-y-1.5 text-xs text-muted">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-light">
                  Workspace
                </span>
                <span className="font-mono text-ink-soft truncate max-w-[150px] text-[11px]">
                  {workspaceName}
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-border my-2" />

          {/* Menu Actions */}
          <div className="space-y-1">
            {onDisconnectWorkspace && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDisconnectWorkspace();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-xs font-medium text-ink hover:bg-surface transition-colors cursor-pointer text-left"
              >
                <svg
                  className="w-4 h-4 text-muted shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
                <span>Switch Workspace</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer text-left group"
            >
              <svg
                className="w-4 h-4 text-red-500 group-hover:text-red-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
