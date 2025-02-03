/* eslint-disable no-unused-vars */
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar/Navbar";
import RegisterForm from "./components/Register/RegisterForm";
import Login from "./components/Login/Login";
import AllFlats from "./components/AllFlats/AllFlats";
import ProfileUpdate from "./components/ProfileUpdate/ProfileUpdate";
import MyFlats from "./components/AddFlatForm/MyFlats";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import { db } from "../src/components/config/firebase";
import { getDocs, collection } from "firebase/firestore";
import PropTypes from "prop-types";
import { ToastProvider } from "./ToastContext";
import ApartmentDetails from "./components/ApartmentDetails/ApartmentDetails";
import FixedBackground from "./components/FixedBackground/FixedBackground";


function AppContent() {
  const [user, setUser] = useState(null); // Track the current user
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is an admin
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const auth = getAuth();

  const location = useLocation();

  const notifyWelcome = useCallback(() => {
    const hasShownToast = localStorage.getItem("hasShownWelcomeToast");
    if (!hasShownToast) {
      toast.success("Welcome back!", { position: "bottom-right" });
      localStorage.setItem("hasShownWelcomeToast", "true");
    }
  }, []);

  //Custom reusable toast notifications
  const CustomNotification = ({ data, closeToast }) => (
    <div>
      <h4>{data.title}</h4>
      <p>{data.content}</p>
      <button onClick={closeToast} style={{ color: "red" }}>Close</button>
    </div>
  );
  CustomNotification.propTypes = {
    closeToast: PropTypes.func.isRequired,
    data: PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired
    }).isRequired,
    toastProps: PropTypes.object,
  }

  const notifyAdminError = () => {
    toast.error(
      <CustomNotification
      data={{ title: "Access Denied", content: "You are not authorized to access this page.", }}
      closeToast={() => toast.dismiss()}
      />, { autoClose: 2500, closeButton: false }
    );
  };

  const notifyLogout = () => {
    toast.info("You've been logged out!", {
      position: "bottom-right",
      autoClose: 2500,
    });
  };

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsLoggedIn(true);
        setUser(currentUser);
        notifyWelcome();

        // Fetch admin status from Firestore
        try {
          const usersCollection = collection(db, "users");
          const snapshot = await getDocs(usersCollection);
          const userData = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .find((doc) => doc.userId === currentUser.uid);
          setIsAdmin(userData?.isAdmin || false);
        } catch {
          setIsAdmin(false);
          toast.error("Failed to fetch admin status.")
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth, notifyWelcome]);

   // Fix for Safari toolbar hiding
   useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);

    // Scroll a bit to trigger Safari hiding toolbar
    window.scrollTo(0, 1);

    return () => window.removeEventListener("resize", setVH);
  }, []);

  // Hide Navbar only on login and register pages
  const hideNavbar = !isLoggedIn && ["/login", "/register"].includes(location.pathname);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem("hasShownWelcomeToast");
    notifyLogout();
  };

  return (
    <>
    <FixedBackground />
      {!hideNavbar && isLoggedIn && <Navbar user={{ email: user?.email || "", isAdmin }} onLogout={handleLogout} />}
      <Routes>
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my-flats" element={<ProtectedRoute element={<MyFlats />} isLoggedIn={isLoggedIn} />} />
        <Route path="/" element={<ProtectedRoute element={<AllFlats setUserName={setUserName} />} isLoggedIn={isLoggedIn} />} />
        <Route path="/profile-update" element={<ProtectedRoute element={<ProfileUpdate />} isLoggedIn={isLoggedIn} />} />
        <Route path="/apartment/:id" element={<ProtectedRoute element={<ApartmentDetails />} isLoggedIn={isLoggedIn} />} />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute
              element={<AdminPanel />}
              isLoggedIn={isLoggedIn}
              additionalCheck={isAdmin}
              fallback={() => {
                notifyAdminError();
              return(<div>You are not authorized to access this page.</div>)
            }}
            />
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
    
      <Router>
        <AppContent />
      </Router>
      <ToastContainer
      closeButton={false}
      position="bottom-right"
      autoClose={2500}
      hideProgressBar={true}
      theme="colored"
       />
    
    </ToastProvider>
  );
}

export default App;