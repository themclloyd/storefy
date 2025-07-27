import { useNavigate } from 'react-router-dom';
import { SimpleFocusedDashboard } from './SimpleFocusedDashboard';

/**
 * Simple Focused Dashboard wrapper that provides navigation for router-based usage
 */
export function SimpleFocusedDashboardWithNavigation() {
  const navigate = useNavigate();

  const handleViewChange = (view: string) => {
    navigate(`/app/${view}`);
  };

  return <SimpleFocusedDashboard onViewChange={handleViewChange} />;
}
