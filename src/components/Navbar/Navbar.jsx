import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { auth } from '../config/firebase'; // Import Firebase authentication
import styles from './Navbar.module.css';
import PropTypes from 'prop-types';
import { FaBars, FaTimes } from 'react-icons/fa'; // Import hamburger icons

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle the menu

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev); // Toggle menu state
  };

  const handleLogout = () => {
    auth.signOut(); // Log out the user from Firebase
    if (onLogout) {
      onLogout(); // Update the parent state (optional)
    }
    setIsMenuOpen(false); // Close the menu after logout
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img src="../../../public/logo.png" alt="logo" className={styles.logoImage} />
        </div>

        {/* Hamburger Icon */}
        <div className={styles.hamburger} onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>

        {/* Navigation Links */}
        <ul className={`${styles.navLinks} ${isMenuOpen ? styles.open : ''}`}>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? styles.activeLink : '')}
              onClick={() => setIsMenuOpen(false)}
            >
              All Flats
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/my-flats"
              className={({ isActive }) => (isActive ? styles.activeLink : '')}
              onClick={() => setIsMenuOpen(false)}
            >
              My Flats
            </NavLink>
          </li>
          {/* Conditional rendering based on user state */}
          {user ? (
            <>
              {user.isAdmin && (
                <li>
                  <NavLink
                    to="/admin-panel"
                    className={({ isActive }) => (isActive ? styles.activeLink : '')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </NavLink>
                </li>
              )}
              <li className={styles.greeting}>
                <NavLink 
                  to="/profile-update"
                  >
                  Hello, {user.email}
                </NavLink>
              </li>
              <li className={styles.logoutContainer}>
                <button
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink
                  to="/register"
                  className={({ isActive }) => (isActive ? styles.activeLink : '')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? styles.activeLink : '')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

Navbar.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    isAdmin: PropTypes.bool,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Navbar;