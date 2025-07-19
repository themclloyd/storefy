import { useNavigate } from 'react-router-dom';
import { ReportsView } from './ReportsView';

/**
 * Reports wrapper that provides navigation for router-based usage
 * This maintains consistency with the Zustand pattern while working with React Router
 */
export function ReportsWithNavigation() {
  const navigate = useNavigate();

  const handleViewChange = (view: string) => {
    navigate(`/app/${view}`);
  };

  return <ReportsView onViewChange={handleViewChange} />;
}
