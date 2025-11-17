import { useNavigate } from 'react-router-dom';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const handleViewChange = (view: string) => {
    if (view === 'order-management') {
      navigate('/admin/orders');
    } else if (view === 'client-management') {
      navigate('/admin/clients');
    }
  };

  return <AdminDashboard onViewChange={handleViewChange} />;
}
