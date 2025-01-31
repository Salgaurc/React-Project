import { useState, useEffect } from "react";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  sendEmailVerification as firebaseSendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./ProfileUpdate.module.css";

const ProfileUpdate = () => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
  });

  const [docId, setDocId] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [password, setPassword] = useState("");

  // Fetch user data from Firestore on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const userQuery = query(collection(db, "users"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            setFormData({
              userName: userData.userName || "",
              email: userData.email || "",
              birthDate: userData.birthDate || "",
              password: "",
              confirmPassword: "",
            });
            setDocId(userDoc.id);
          } else {
            toast.error("User data not found in Firestore.");
          }
        } else {
          toast.error("User is not authenticated.");
        }
      } catch {
        toast.error("Error fetching user data.");
      }
    };

    fetchUserData();
  }, [user, db]);

  // Handle form field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!user) {
        toast.error("User not authenticated.");
        return;
      }

      // Check if the user is trying to update the email
      if (formData.email && formData.email !== user.email) {
        await sendVerificationEmail(); // Send email verification first
        setIsReauthModalOpen(true); // Ask for reauthentication
        return;
      }

      // Proceed with profile update (if no sensitive fields are being updated)
      await updateProfileFields();
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile. Please try again.");
    }
  };

  // Send email verification before updating email
  const sendVerificationEmail = async () => {
    try {
      const user = auth.currentUser;

      if (user && !user.emailVerified) {
        await firebaseSendEmailVerification(user); // Use Firebase's sendEmailVerification
        toast.info("A verification email has been sent. Please verify your email.");
      } else {
        toast.info("Your email is already verified.");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Error sending verification email.");
    }
  };

  // Update profile fields in Firebase
  const updateProfileFields = async () => {
    try {
      // Update display name
      if (formData.userName && formData.userName !== user.displayName) {
        await updateProfile(user, { displayName: formData.userName });
      }

      // Update email only after verification
      if (formData.email && formData.email !== user.email && user.emailVerified) {
        await updateEmail(user, formData.email); // Update the email in Firebase Auth
      }

      // Update password if provided and verified
      if (formData.password && formData.password === formData.confirmPassword) {
        await updatePassword(user, formData.password);
      }

      // Update Firestore document
      if (docId) {
        const userDocRef = doc(db, "users", docId);
        await updateDoc(userDocRef, {
          userName: formData.userName,
          email: formData.email,
          birthDate: formData.birthDate,
        });
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating profile. Please try again.");
    }
  };

  // Handle reauthentication confirmation
  const handleReauthConfirm = async () => {
    if (!password) {
      toast.error("Password is required to confirm.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await updateProfileFields(); // Proceed to update fields after reauth
      setIsReauthModalOpen(false); // Close reauth modal
      setPassword("");
    } catch (error) {
      console.error("Error during reauthentication:", error);
      toast.error("Reauthentication failed. Please try again.");
    }
  };

  const closeReauthModal = () => {
    setIsReauthModalOpen(false);
    setPassword("");
  };

  // Handle delete profile
  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!password) {
      toast.error("Password is required to confirm deletion.");
      return;
    }

    try {
      if (!user) {
        toast.error("User not authenticated.");
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Remove user's favorites
      const favoritesQuery = query(collection(db, "favorites"), where("userId", "==", user.uid));
      const favoritesSnapshot = await getDocs(favoritesQuery);

      if (!favoritesSnapshot.empty) {
        const removeFavorites = favoritesSnapshot.docs.map(async (docRef) => {
          await deleteDoc(docRef.ref);
        });
        await Promise.all(removeFavorites);
      }

      // Remove user data from Firestore
      const userDocRef = doc(db, "users", docId);
      await deleteDoc(userDocRef);

      // Delete user files in Firebase Storage
      const userStorageRef = ref(storage, `users/${user.uid}`);
      const files = await listAll(userStorageRef);
      if (files.items.length > 0) {
        const deleteFiles = files.items.map((fileRef) => deleteObject(fileRef));
        await Promise.all(deleteFiles);
      }

      // Delete user in Firebase Auth
      await deleteUser(user);

      toast.success("Account deleted successfully.");
      navigate("/register");
    } catch (error) {
      console.error("Error during account deletion:", error);
      toast.error("Error deleting account. Please try again.");
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPassword("");
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.title}>Update Profile</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>Username</label>
        <input
          type="text"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          className={styles.inputGroup}
          required
        />
        <label className={styles.label}>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={styles.inputGroup}
          required
        />
        <label className={styles.label}>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={styles.inputGroup}
          placeholder="Leave blank to keep current password"
        />
        <label className={styles.label}>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={styles.inputGroup}
          placeholder="Re-enter your password"
        />
        <label className={styles.label}>Birth Date</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          className={styles.inputGroup}
        />
        <div className={styles.buttonsContainer}>
          <button type="submit" className={styles.updateButton}>Update Profile</button>
          <button type="button" onClick={handleDelete} className={styles.deleteButton}>Delete Profile</button>
        </div>
      </form>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Are you sure you want to delete your account?</h3>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: "10px", marginBottom: "10px" }}
            />
            <br />
            <button onClick={confirmDelete} className={styles.modalConfirmBtn}>Yes</button>
            <button onClick={closeDeleteModal} className={styles.modalCancelBtn}>No</button>
          </div>
        </div>
      )}

      {/* Reauthentication Modal */}
      {isReauthModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Reauthenticate</h3>
            <p>To update sensitive information, please confirm your current password.</p>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputGroup}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleReauthConfirm} className={styles.modalConfirmBtn}>
                Confirm
              </button>
              <button onClick={closeReauthModal} className={styles.modalCancelBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUpdate;