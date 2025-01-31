import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const ProtectedRoute = ({ element, isLoggedIn, user }) => {
    if (!isLoggedIn) {
        return <Navigate to="/register" />;
    }

    if (user && !user.isAdmin) {
        return <Navigate to="/" />;
    }
    return element;
};

ProtectedRoute.propTypes = {
    element: PropTypes.node.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
    user: PropTypes.shape({
        isAdmin: PropTypes.bool,
    }),
};

export default ProtectedRoute;