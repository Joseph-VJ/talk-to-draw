import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import Gallery from './components/Gallery';
import './index.css';

function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">🎨</span>
          <span>TalkDraw</span>
        </Link>

        <nav className="nav">
          <Link to="/" className="nav-link">Draw</Link>
          <Link to="/gallery" className="nav-link">Gallery</Link>
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
