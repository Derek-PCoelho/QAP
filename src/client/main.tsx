import { createRoot } from 'react-dom/client';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-600.css';
import '@fontsource/pixelify-sans/latin-ext-400.css';
import '@fontsource/vt323/latin-400.css';
import '@fontsource/vt323/latin-ext-400.css';
import '@fontsource/jacquard-24/latin-400.css';
import './styles/base.css';
import './styles/screens.css';
import './styles/desk.css';
import './styles/home.css';
import './styles/minigames.css';
import './styles/simone.css';
import './styles/field.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
