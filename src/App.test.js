import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/login', () => () => <h1>Welcome Back</h1>);
jest.mock('./pages/register', () => () => <h1>Register</h1>);
jest.mock('./pages/home', () => () => <h1>Home</h1>);
jest.mock('./pages/account', () => () => <h1>Account</h1>);
jest.mock('./modules/firebase', () => ({auth: {}}));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, callback) => {
    callback(null);
    return jest.fn();
  },
  signOut: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-router-dom', () => {
  const React = require('react');

  return {
    BrowserRouter: ({ children }) => children,
    Routes: ({ children }) => React.Children.toArray(children)[0],
    Route: ({ element }) => element,
    Navigate: () => null,
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
}, { virtual: true });

test('renders the login screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});
