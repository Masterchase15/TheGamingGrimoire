import { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/Common.jsx';
import { useSession } from './lib/auth.js';
import Home from './pages/Home.jsx';
const Category = lazy(() => import('./pages/Category.jsx'));
const Game = lazy(() => import('./pages/Game.jsx'));
const WikiSection = lazy(() => import('./pages/WikiSection.jsx'));
const FandomArticle = lazy(() => import('./pages/FandomArticle.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Login = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Auth.jsx').then((m) => ({ default: m.Signup })));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Community = lazy(() => import('./pages/Community.jsx'));
const Forums = lazy(() => import('./pages/Forums.jsx'));
const Thread = lazy(() => import('./pages/Thread.jsx'));
const NewThread = lazy(() => import('./pages/NewThread.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function RequireAuth({ children }) {
  const { data, isPending } = useSession();
  const location = useLocation();
  if (isPending) {
    return (
      <div className="page container" style={{ display: 'grid', placeItems: 'center' }}>
        <Spinner />
      </div>
    );
  }
  if (!data?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="video-games" element={<Category category="video" />} />
        <Route path="board-games" element={<Category category="board" />} />
        <Route path="card-games" element={<Category category="card" />} />
        <Route path="game/:slug" element={<Game />} />
        <Route path="game/:slug/wiki/*" element={<FandomArticle />} />
        <Route path="game/:slug/:section" element={<WikiSection />} />
        <Route path="search" element={<Search />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="u/:username" element={<Profile />} />
        <Route
          path="community"
          element={
            <RequireAuth>
              <Community />
            </RequireAuth>
          }
        />
        <Route path="forums" element={<Forums />} />
        <Route
          path="forums/new"
          element={
            <RequireAuth>
              <NewThread />
            </RequireAuth>
          }
        />
        <Route path="forums/:id" element={<Thread />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
