import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BugReportIcon from '@mui/icons-material/BugReport';
import HomeIcon from '@mui/icons-material/Home';
import PublicIcon from '@mui/icons-material/Public';

import asyncComponentLoader from '@/utils/loader';

import { Routes } from './types';

const routes: Routes = [
  {
    component: asyncComponentLoader(() => import('@/pages/Home')),
    path: '/',
  },
  {
    component: asyncComponentLoader(() => import('@/pages/Home')),
    path: '/home',
    title: 'Home',
    icon: HomeIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/AvatarLegends')),
    path: '/avatar-legends',
    title: 'Avatar Legends',
    icon: PublicIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/Welcome')),
    path: '/welcome',
    title: 'Welcome',
    icon: HomeIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/FabU')),
    path: '/fab-u',
    title: 'Fab U',
    icon: AutoAwesomeIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/Page4')),
    path: '/page-4',
    title: 'Page 4',
    icon: BugReportIcon,
  },
  {
    component: asyncComponentLoader(() => import('@/pages/NotFound')),
    path: '*',
  },
];

export default routes;
