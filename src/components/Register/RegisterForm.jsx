import { useState } from "react";
import { setDoc, doc } from "firebase/firestore"; // Import `setDoc` and `doc`
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./RegisterForm.module.css";

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userName: "",
    birthDate: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear the error for the current field
    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (!formData.userName) {
      newErrors.userName = "User name is required";
    } else if (formData.userName.length < 2) {
      newErrors.userName = "User name must be at least 2 characters long.";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    } else {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      if (birthDate > today) {
        newErrors.birthDate = "Birth date cannot be in the future.";
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      try {
        // Firebase Auth: Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Add user details to Firestore using `setDoc`
        await setDoc(doc(db, "users", user.uid), {
          email: formData.email,
          userName: formData.userName,
          birthDate: formData.birthDate,
          createdAt: new Date(),
          userId: user.uid,
          isAdmin: false, // Default value
        });

        toast.success("User registered successfully!");
        navigate("/");

        // Reset form
        setFormData({
          email: "",
          password: "",
          userName: "",
          birthDate: "",
        });
        setErrors({});
      } catch (error) {
        console.error("Error registering user:", error);
        toast.error("Error registering user, please try again!");
      }
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.registerForm}>
        <h1 className={styles.formTitle}>Register</h1>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          {/* User Name */}
          <div className={styles.inputGroup}>
            <label htmlFor="userName">User Name:</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              required
            />
            {errors.userName && <span className={styles.error}>{errors.userName}</span>}
          </div>

          {/* Birth Date */}
          <div className={styles.inputGroup}>
            <label htmlFor="birthDate">Birth Date:</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
            />
            {errors.birthDate && <span className={styles.error}>{errors.birthDate}</span>}
          </div>

          {/* Submit and redirect Button */}
          <button type="submit">Register</button>
          <button type="button" onClick={handleLoginRedirect}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;