import { lazy } from 'react';
import Loadable from 'components/Loadable';

// Render simple placeholder layouts since we just want a simple modern landing page
const WebsiteLayout = Loadable(lazy(() => import('pages/website/layout')));
const AppIndex = Loadable(lazy(() => import('pages/website/AppIndex')));
const About = Loadable(lazy(() => import('pages/website/about')));
const Products = Loadable(lazy(() => import('pages/website/products')));
const Contact = Loadable(lazy(() => import('pages/website/contact')));
const BecomeDealer = Loadable(lazy(() => import('pages/website/become-dealer')));
const JoinUs = Loadable(lazy(() => import('pages/website/join-us')));

const WebsiteRoutes = {
  path: '/',
  element: <WebsiteLayout />,
  children: [
    { index: true, element: <AppIndex /> },
    { path: 'about', element: <About /> },
    { path: 'products', element: <Products /> },
    { path: 'become-dealer', element: <BecomeDealer /> },
    { path: 'join-us', element: <JoinUs /> },
    { path: 'contact', element: <Contact /> }
  ]
};

export default WebsiteRoutes;
