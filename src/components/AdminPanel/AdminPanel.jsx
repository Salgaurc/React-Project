import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore"; // Correct import for getDoc
import { db } from "../config/firebase";
import { useAdminAuth } from "/src/AdminAuth";
import { toast } from "react-toastify";
import styles from "./AdminPanel.module.css";

const AdminPanel = () => {
  const { isAdmin, loading } = useAdminAuth(); // Use the custom hook
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.userName && user.email); // Ensure only valid users are shown
        setUsers(usersData);
      } catch {
        toast.error("Error fetching users.");
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleMakeAdmin = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { isAdmin: true });
      toast.success("User promoted to admin successfully.");
      setUsers(users.map((user) => (user.id === userId ? { ...user, isAdmin: true } : user)));
    } catch {
      toast.error("Error promoting user to admin.");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      // 1. Get the user data from Firestore
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef); // Get user data from Firestore
      const userData = userDoc.data();

      if (!userData) {
        toast.error("User not found.");
        return;
      }

      // 2. Delete the user from Firestore
      await deleteDoc(userRef);
      toast.success("User deleted from Firestore successfully.");

      // 3. Update the users state to remove the deleted user
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    toast.error("You are not authorized to view this page.");
    return null;
  }

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.title}>Admin Panel</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.userName}</td>
              <td>{user.email}</td>
              <td>{user.isAdmin ? "Admin" : "User"}</td>
              <td>
                <button
                  onClick={() => handleMakeAdmin(user.id)}
                  className={styles.promoteBtn}
                >
                  Promote to Admin
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className={styles.deleteBtn}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;