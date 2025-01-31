/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);

    useEffect(() => {
        setHasShownWelcomeToast(false);
    }, []);

    return (
        <ToastContext.Provider value={{ hasShownWelcomeToast, setHasShownWelcomeToast}}>
            {children}
        </ToastContext.Provider>
    );
};

ToastProvider.propTypes = {
    children: PropTypes.node.isRequired,
}