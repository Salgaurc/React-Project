import { useState, useEffect } from "react";
import { auth, db } from "../src/components/config/firebase";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          navigate("/login"); // Redirect if not logged in
          return;
        }

        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const loggedInUser = usersData.find((user) => user.userId === currentUser.uid);

        if (loggedInUser?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false); // Redirect if not an admin
          navigate("/"); // Redirect to homepage or other route
        }
      } catch (error) {
        toast.error("Error checking admin status:", error);
        navigate("/"); // Redirect on error
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [navigate]);

  return { isAdmin, loading };
};