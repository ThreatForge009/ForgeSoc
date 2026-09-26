import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LiveToast from './LiveToast';

const Layout = ({ title }) => (
  <div className="flex h-screen bg-forge-bg text-forge-text">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar title={title} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
    <LiveToast />
  </div>
);

export default Layout;
