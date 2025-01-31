import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { toast } from 'react-toastify';
import styles from './ApartmentDetails.module.css';

const ApartmentDetails = () => {
    const { id } = useParams();
    const [apartment, setApartment] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);

    // Fetch apartment details
    useEffect(() => {
        const fetchApartmentDetails = async () => {
            try {
                const docRef = doc(db, "apartments", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setApartment({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error("Apartment not found!");
                }
            } catch (error) {
                toast.error("Error fetching apartment details!" + error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchApartmentDetails();
    }, [id]);

    // Fetch messages for the current apartment
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const messagesQuery = query(
                    collection(db, "messages"),
                    where("apartmentId", "==", id)
                );
                const querySnapshot = await getDocs(messagesQuery);
                const fetchedMessages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setMessages(fetchedMessages);
            } catch (error) {
                toast.error("Error fetching messages!" + error.message);
            }
        };
        if (id) {
            fetchMessages();
        }
    }, [id]);

    // Handle message form submission
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            toast.error("Please login to send a message!");
            return;
        }

        if (!message.trim()) {
            toast.error("Please enter a message!");
            return;
        }
        try {
            const messagesCollectionRef = collection(db, "messages");
            await addDoc(messagesCollectionRef, {
                apartmentId: id,
                userId: user.uid,
                userName: user.displayName || user.email,
                message,
                timestamp: new Date(),
            });
            toast.success("Message sent successfully!");
            setMessage("");
            // Fetch updated messages after sending
            const messagesQuery = query(
                collection(db, "messages"),
                where("apartmentId", "==", id)
            );
            const querySnapshot = await getDocs(messagesQuery);
            const updatedMessages = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(updatedMessages);
        } catch (error) {
            toast.error("Error sending message!" + error.message);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>
    }
    if (!apartment) {
        return <div className={styles.notFound}>Apartment not found!</div>
    }

    return (
        <div className={styles.mainContainer}>
            {/* Apartment Details */}
            <div className={styles.apartmentDetails}>
                <h2>{apartment.name}</h2>
                <img
                    src={apartment.imageUrl || "/placeholder.png"}
                    alt={apartment.name}
                    className={styles.image}
                />
                <p className={styles.apartmentDescription}>
                    <strong>City:</strong>{apartment.city}
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Street Name:</strong>{apartment.streetName}
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Street Number:</strong>{apartment.streetNumber}
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Area(&#13217;):</strong>{apartment.areaSize}
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Year Built:</strong>{apartment.yearBuilt}
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Price:</strong>{apartment.price}(&#36;)
                </p>
                <p className={styles.apartmentDescription}>
                    <strong>Date Available:</strong>{apartment.dateAvailable}
                </p>
            </div>

            {/* Message Form */}
            <div className={styles.messageForm}>
                <h2>Send a message to the owner</h2>
                <form onSubmit={handleSendMessage}>
                    <textarea
                        className={styles.textArea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                    ></textarea>
                    <button type="submit" className={styles.sendButton}>Send</button>
                </form>
            </div>

            {/* Messages Section */}
            <div className={styles.messagesSection}>
                <h2>Messages</h2>
                {messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} className={styles.messageItem}>
                            <p><strong>{msg.userName}:</strong> {msg.message}</p>
                            <p className={styles.messageTimestamp}>
                                {new Date(msg.timestamp.seconds * 1000).toLocaleString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No messages yet.</p>
                )}
            </div>
        </div>
    );
};

export default ApartmentDetails;