/* eslint-disable no-unused-vars */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import styles from "./AllFlats.module.css";

const AllFlats = ({ setUserName }) => {
  const navigate = useNavigate();
  const [flats, setFlats] = useState([]);
  const [filteredFlats, setFilteredFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Filter state
  const [cityFilter, setCityFilter] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [areaRange, setAreaRange] = useState({ min: "", max: "" });
  const [showFavorites, setShowFavorites] = useState(false);

  // Sort state
  const [sortOption, setSortOption] = useState("city"); // Default sort by city

  // Firebase authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserName(user.displayName);
        setUserEmail(user.email);
        await createUserDoc(user.uid);

        // Fetch user's favorites
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFavorites(userData.favorites || []);
        }
      } else {
        setUserId(null);
        setUserName(null);
        setUserEmail(null);
        setFavorites([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUserName]);

  // Create user document in Firestore if it doesn't exist
  const createUserDoc = async (userId) => {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, { favorites: [] });
    }
  };

  // Fetch flats from Firestore
  const fetchFlats = async () => {
    try {
      const flatsCollectionRef = collection(db, "apartments");
      const flatsData = await getDocs(flatsCollectionRef);
      const flatsArray = flatsData.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFlats(flatsArray);
      setFilteredFlats(flatsArray); // Initialize with all flats
    } catch (error) {
      toast.error("Error fetching flats: " + error.message);
    }
  };

  // Handle adding to favorites
  const handleAddToFavorites = async (flatId) => {
    if (!userId) {
      toast.error("Please login to add or remove flats from favorites!");
      return;
    }

    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentFavorites = userData.favorites || [];
        let updatedFavorites;

        if (currentFavorites.includes(flatId)) {
          updatedFavorites = currentFavorites.filter((id) => id !== flatId);
          toast.info("Flat removed from favorites!");
        } else {
          updatedFavorites = [...currentFavorites, flatId];
          toast.success("Flat added to favorites!");
        }

        // Update Firestore
        await updateDoc(userDocRef, { favorites: updatedFavorites });

        // Update local state immediately
        setFavorites(updatedFavorites);
      } else {
        toast.error("User not found! Please ensure your user data is set up.");
      }
    } catch (error) {
      toast.error("Error updating favorites: " + error.message);
    }
  };

  // Filter flats
  useEffect(() => {
    let filtered = [...flats];

    // Filter by city
    if (cityFilter) {
      filtered = filtered.filter((flat) =>
        flat.city.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter((flat) => {
      const price = Number(flat.price);
      const minPrice =
        priceRange.min !== "" ? Number(priceRange.min) : -Infinity;
      const maxPrice =
        priceRange.max !== "" ? Number(priceRange.max) : Infinity;
      return price >= minPrice && price <= maxPrice;
    });

    // Filter by area size
    filtered = filtered.filter((flat) => {
      const area = Number(flat.areaSize);
      const minArea = areaRange.min !== "" ? Number(areaRange.min) : -Infinity;
      const maxArea = areaRange.max !== "" ? Number(areaRange.max) : Infinity;
      return area >= minArea && area <= maxArea;
    });

    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter((flat) => favorites.includes(flat.id));
    }

    // Apply sorting
    if (sortOption === "price") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price)); // Sort by price
    } else if (sortOption === "area") {
      filtered.sort((a, b) => Number(a.areaSize) - Number(b.areaSize)); // Sort by area size
    } else if (sortOption === "city") {
      filtered.sort((a, b) => a.city.localeCompare(b.city)); // Sort by city alphabetically
    }

    // Update the filteredFlats state
    setFilteredFlats(filtered);
  }, [
    flats,
    cityFilter,
    priceRange,
    areaRange,
    showFavorites,
    favorites,
    sortOption,
  ]);

  // Fetch flats when user is authenticated
  useEffect(() => {
    if (userId) {
      fetchFlats();
    }
  }, [userId]);

  const handleResetAllFilters = () => {
    setCityFilter("");
    setPriceRange({ min: "", max: "" });
    setAreaRange({ min: "", max: "" });
    setSortOption("city");
    setShowFavorites(false);
  };

  // Reset Sort
  const handleResetSort = () => setSortOption("city");

  // Handle deleting a flat
  const handleDeleteFlat = async (flatId) => {
    if (!userId) {
      toast.error("Please log in to delete a flat.");
      return;
    }

    try {
      const flatDocRef = doc(db, "apartments", flatId);
      const flatDoc = await getDoc(flatDocRef);

      if (flatDoc.exists()) {
        const flatData = flatDoc.data();
        if (flatData.addedBy === userId) {
          await deleteDoc(flatDocRef);
          toast.success("Flat deleted successfully!");
          setFlats((prevFlats) =>
            prevFlats.filter((flat) => flat.id !== flatId)
          );
        } else {
          toast.error("You can only delete flats that you added.");
        }
      } else {
        toast.error("Flat not found!");
      }
    } catch (error) {
      toast.error("Error deleting flat: " + error.message);
    }
  };

  // Fetch flats when user is authenticated
  useEffect(() => {
    if (userId) {
      fetchFlats();
    }
  }, [userId]);

  // Loading state
  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.mainContainer}>
      <div className={styles.filtersMainContainer}>
        <div className={styles.filtersSubContainer}>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: e.target.value })
              }
            />
          </div>
          <div className={styles.filters}>
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: e.target.value })
              }
            />
          </div>
          <div className={styles.filters}>
            <input
              type="number"
              placeholder="Min area size"
              value={areaRange.min}
              onChange={(e) =>
                setAreaRange({ ...areaRange, min: e.target.value })
              }
            />
          </div>
          <div className={styles.filters}>
            <input
              type="number"
              placeholder="Max area size"
              value={areaRange.max}
              onChange={(e) =>
                setAreaRange({ ...areaRange, max: e.target.value })
              }
            />
          </div>
          <div className={styles.resetBtnContainer}>
            <button
              className={styles.resetFilter}
              onClick={handleResetAllFilters}
            >
              X
            </button>
          </div>
          <div className={styles.checkboxContainer}>
            <label>
              <input
                type="checkbox"
                checked={showFavorites}
                onChange={(e) => setShowFavorites(e.target.checked)}
              />
              <span>Show Favorites</span>
            </label>
          </div>
          {/* Sort by dropdown */}
          <div className={styles.filters}>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="city">City</option>
              <option value="price">Price</option>
              <option value="area">Area</option>
            </select>
            <button className={styles.resetFilter} onClick={handleResetSort}>
              X
            </button>
          </div>
        </div>
      </div>
      <div className={styles.cardContainer}>
        {filteredFlats.length > 0 ? (
          filteredFlats.map((flat) => (
            <div
              className={styles.card}
              key={flat.id}
              onClick={() => navigate(`/apartment/${flat.id}`)}
            >
              {flat.imageUrl && (
                <img
                  className={styles.image}
                  src={flat.imageUrl}
                  alt={flat.name}
                />
              )}
              <h2 className={styles.cardTitle}>{flat.name}</h2>
              <p className={styles.cardDescription}>
                <strong>City:</strong> {flat.city}
              </p>
              <p className={styles.cardDescription}>
                <strong>Street Name:</strong> {flat.streetName}
              </p>
              <p className={styles.cardDescription}>
                <strong>Street Number:</strong> {flat.streetNumber}
              </p>
              <p className={styles.cardDescription}>
                <strong>Area(&#13217;):</strong> {flat.areaSize}
              </p>
              <p className={styles.cardDescription}>
                <strong>Year Built:</strong> {flat.yearBuilt}
              </p>
              <p className={styles.cardDescription}>
                <strong>Price:</strong> {flat.price} (&#36;)
              </p>
              <p className={styles.cardDescription}>
                <strong>Date Available:</strong> {flat.dateAvailable}
              </p>
              <div className={styles.buttonsContainer}>
                <button
                  className={`${styles.favoritesButton} ${
                    favorites.includes(flat.id) ? styles.activeFavorite : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToFavorites(flat.id);
                  }}
                >
                  &#x2665;
                </button>
                {!userId && (
                  <p className={styles.error}>
                    Log in to add or remove from favorites
                  </p>
                )}
                {userId && flat.addedBy === userId && (
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFlat(flat.id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noFlats}>No flats available.</p>
        )}
      </div>
    </div>
  );
};

AllFlats.propTypes = {
  setUserName: PropTypes.func.isRequired,
};

export default AllFlats;
