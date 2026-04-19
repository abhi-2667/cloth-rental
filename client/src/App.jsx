import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import BookingPage from './pages/BookingPage';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import MagicLinkVerifier from './pages/MagicLinkVerifier';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="page-container container app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/cloth/:id" element={<BookingPage />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/verify-link" element={<MagicLinkVerifier />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
