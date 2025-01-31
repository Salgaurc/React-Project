import { toast } from "react-toastify";
import { useState, useEffect } from 'react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from '../config/firebase';
import styles from './MyFlats.module.css';
import { useNavigate } from 'react-router-dom';

const MyFlats = () => {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [streetName, setStreetName] = useState("");
    const [streetNumber, setStreetNumber] = useState("");
    const [areaSize, setAreaSize] = useState("");
    const [hasAC, setHasAC] = useState(false);
    const [yearBuilt, setYearBuilt] = useState("");
    const [price, setPrice] = useState("");
    const [dateAvailable, setDateAvailable] = useState("");
    const [image, setImage] = useState(null);
    const [myFlats, setMyFlats] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    // Fetch user-specific flats
    useEffect(() => {
        const fetchMyFlats = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const apartmentsCollectionRef = collection(db, "apartments");
                    const q = query(apartmentsCollectionRef, where("userId", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    const flats = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setMyFlats(flats);
                } catch (error) {
                    toast.error("Failed to fetch user flats: ", error);
                }
            }
        };

        fetchMyFlats();
    }, []);

    const handleImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            setImage(selectedFile);
        } else {
            toast.error("Please select an image file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            !name ||
            !city ||
            !streetName ||
            !streetNumber ||
            !areaSize ||
            !yearBuilt ||
            !price ||
            !dateAvailable
        ) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            setIsUploading(true);
            const user = auth.currentUser;
            if (!user) {
                toast.error("You must be logged in to add an apartment.");
                setIsUploading(false);
                return;
            }

            let imageUrl = null;
            if (image) {
                const imageRef = ref(storage, `apartment-images/${image.name}`);
                const uploadTask = uploadBytesResumable(imageRef, image);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => {
                            toast.error("Image upload failed. Please try again.");
                            setIsUploading(false);
                            reject(error);
                        },
                        async () => {
                            imageUrl = await getDownloadURL(imageRef);
                            resolve();
                        }
                    );
                });
            }

            const apartmentsCollectionRef = collection(db, "apartments");

            await addDoc(apartmentsCollectionRef, {
                name,
                city,
                streetName,
                streetNumber: parseInt(streetNumber, 10),
                areaSize: parseFloat(areaSize),
                hasAC,
                yearBuilt: parseInt(yearBuilt, 10),
                price: parseFloat(price),
                dateAvailable,
                imageUrl,
                userId: user.uid,
                addedBy: user.uid,
            });

            toast.success("Apartment added successfully!");
            navigate("/");
            setName("");
            setCity("");
            setStreetName("");
            setStreetNumber("");
            setAreaSize("");
            setHasAC(false);
            setYearBuilt("");
            setPrice("");
            setDateAvailable("");
            setImage(null);
            setUploadProgress(0);
            setIsUploading(false);

            // Refresh the list of flats
            setMyFlats((prev) => [
                ...prev,
                {
                    name,
                    city,
                    streetName,
                    streetNumber: parseInt(streetNumber, 10),
                    areaSize: parseFloat(areaSize),
                    hasAC,
                    yearBuilt: parseInt(yearBuilt, 10),
                    price: parseFloat(price),
                    dateAvailable,
                    imageUrl,
                    userId: user.uid,
                    addedBy: user.uid,
                },
            ]);
        } catch {
            toast.error("Apartment addition failed. Please try again.");
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.addApartmentForm}>
                <h2 className={styles.formTitle}>Add Apartment</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Apartment Name */}
                    <div className={styles.inputGroup}>
                        <label>Apartment Name:</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter apartment name"
                            required
                        />
                    </div>
                    {/* City */}
                    <div className={styles.inputGroup}>
                        <label>City:</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Enter city"
                            required
                        />
                    </div>
                    {/* Street Name */}
                    <div className={styles.inputGroup}>
                        <label>Street Name:</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={streetName}
                            onChange={(e) => setStreetName(e.target.value)}
                            placeholder="Enter street name"
                            required
                        />
                    </div>
                    {/* Street Number */}
                    <div className={styles.inputGroup}>
                        <label>Street Number:</label>
                        <input
                            className={styles.input}
                            type="number"
                            value={streetNumber}
                            onChange={(e) => setStreetNumber(e.target.value)}
                            placeholder="Enter street number"
                            required
                        />
                    </div>
                    {/* Area Size */}
                    <div className={styles.inputGroup}>
                        <label>Area Size (&#13217;):</label>
                        <input
                            className={styles.input}
                            type="number"
                            value={areaSize}
                            onChange={(e) => setAreaSize(e.target.value)}
                            placeholder="Enter area size"
                            required
                        />
                    </div>
                    {/* Year Built */}
                    <div className={styles.inputGroup}>
                        <label>Year Built:</label>
                        <input
                            className={styles.input}
                            type="number"
                            value={yearBuilt}
                            onChange={(e) => setYearBuilt(e.target.value)}
                            placeholder="Enter year built"
                            required
                        />
                    </div>
                    {/* Price */}
                    <div className={styles.inputGroup}>
                        <label>Price (&#36;):</label>
                        <input
                            className={styles.input}
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Enter price"
                            required
                        />
                    </div>
                    {/* Date Available */}
                    <div className={styles.inputGroup}>
                        <label>Date Available:</label>
                        <input
                            className={styles.input}
                            type="date"
                            value={dateAvailable}
                            onChange={(e) => setDateAvailable(e.target.value)}
                            required
                        />
                    </div>
                    {/* AC checkbox */}
                    <div className={styles.checkboxDiv}>
                        <label>
                            <p>Has AC</p>
                            <input
                                className={styles.checkbox}
                                type="checkbox"
                                checked={hasAC}
                                onChange={() => setHasAC(!hasAC)}
                            />
                        </label>
                    </div>
                    {/* Image */}
                    <div className={styles.image}>
                        <input
                            className={styles.inputImage}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                        />
                    </div>
                    {uploadProgress > 0 && (
                        <p>Upload Progress: {Math.round(uploadProgress)}%</p>
                    )}
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isUploading}
                        className={styles.button}
                    >
                        {isUploading ? "Uploading..." : "Add Apartment"}
                    </button>
                </form>
            </div>
            <div className={styles.myFlatsContainer}>
                <h2>My Flats</h2>
                {myFlats.length === 0 ? (
                    <p>No apartments found.</p>
                ) : (
                    <ul className={styles.flatList}>
                        {myFlats.map((flat) => (
                            <li key={flat.id || `${flat.name}-${flat.city}`} className={styles.flatItem}>
                                <img
                                    src={flat.imageUrl || "/placeholder.png"}
                                    alt={flat.name}
                                    className={styles.flatImage}
                                    onClick={() => navigate(`/apartment/${flat.id}`)}
                                />
                                <div className={styles.flatDetails}>
                                    <h3>{flat.name}</h3>
                                    <p>{flat.city}</p>
                                    <p>
                                        {flat.streetName} {flat.streetNumber}
                                    </p>
                                    <p>Price: ${flat.price}</p>
                                    <p>Available: {flat.dateAvailable}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default MyFlats;