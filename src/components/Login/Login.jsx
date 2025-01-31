import { useState } from "react";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./Login.module.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      // Attempt to sign in with email and password
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login successful!");
      navigate("/"); // Redirect after successful login
    } catch (err) {
      console.log(err.code);
      if (err.code === "auth/invalid-credential") {
        setError("User not found. Please register.");
        setTimeout(() => {
          navigate("/register"); // Redirect to register after a short delay
        }, 2000);
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.formContainer}>
        <h1 className={styles.formTitle}>Login</h1>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email:</label>
            <input
              className={styles.input}
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Login
          </button>
          <button
            type="button"
            onClick={handleRegisterRedirect}
            className={styles.button}
          >
            {" "}
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
