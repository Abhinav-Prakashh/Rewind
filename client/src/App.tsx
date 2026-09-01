import { useRepo } from './hooks/useApi';
import { ConnectRepo } from './components/ConnectRepo';
import { Dashboard } from './components/Dashboard';

function App() {
  const { repos, activeRepo, loading, error, connectRepo, deselectRepo, selectRepo } = useRepo();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-violet mb-4">
            <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">Loading your memory...</p>
        </div>
      </div>
    );
  }

  // No repo selected — always show the repo selection / connect screen
  if (!activeRepo) {
    return (
      <ConnectRepo
        repos={repos}
        onConnect={async (path) => {
          await connectRepo(path);
        }}
        onSelect={selectRepo}
        error={error}
      />
    );
  }

  // Dashboard
  return (
    <Dashboard
      repo={activeRepo}
      onDisconnect={deselectRepo}
    />
  );
}

export default App;
