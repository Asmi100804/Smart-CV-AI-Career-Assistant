import { Form, Link, useLocation, useRouteLoaderData } from 'react-router';
import { DASHBOARD_ROUTE, FEATURE_DEFINITIONS } from '~/constants/features';
import type { loader as rootLoader } from '~/root';

const getEmailInitials = (email: string) => {
  const [localPart] = email.split('@');
  const segmentedParts = localPart
    .replace(/[0-9]+/g, ' ')
    .split(/[._-]+|\s+/)
    .filter(Boolean);

  if (segmentedParts.length >= 2) {
    return `${segmentedParts[0][0]}${segmentedParts[1][0]}`.toUpperCase();
  }

  if (localPart.length > 1) {
    const midpointIndex = Math.floor(localPart.length / 2);
    return `${localPart[0]}${localPart[midpointIndex]}`.toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase();
};

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const rootData = useRouteLoaderData<typeof rootLoader>('root');

  return (
    <nav className='navbar gap-4'>
      <Link to={DASHBOARD_ROUTE}>
        <p className='text-2xl font-bold text-gradient'>SmartCV</p>
      </Link>

      <div className='flex gap-3 items-center max-md:hidden'>
        {FEATURE_DEFINITIONS.map((feature) => (
          <Link
            key={feature.key}
            to={feature.path}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              currentPath === feature.path
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {feature.title}
          </Link>
        ))}
      </div>

      <div className='flex items-center gap-3'>
        {rootData?.userEmail && (
          <div className='relative group'>
            <button
              type='button'
              className='size-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold tracking-wide cursor-default'
              aria-label='User account'
            >
              {getEmailInitials(rootData.userEmail)}
            </button>

            <div className='absolute right-0 top-12 hidden group-hover:flex flex-col gap-3 min-w-[220px] bg-white border border-gray-200 rounded-2xl shadow-lg p-4 z-30'>
              <p className='text-xs text-gray-500'>Signed in as</p>
              <p className='text-sm text-gray-800 break-all'>{rootData.userEmail}</p>
              <Form method='post' action='/logout'>
                <button
                  type='submit'
                  className='w-full px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer text-sm'
                >
                  Logout
                </button>
              </Form>
            </div>
          </div>
        )}

        <div className='md:hidden'>
          <select
            className='px-4 py-2 rounded-full border border-gray-200 bg-white font-medium'
            value={currentPath}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
          >
            <option value={DASHBOARD_ROUTE}>Dashboard</option>
            {FEATURE_DEFINITIONS.map((feature) => (
              <option key={feature.key} value={feature.path}>
                {feature.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
