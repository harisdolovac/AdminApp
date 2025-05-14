import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Home from "./pages/Home/Home";
import HomeProductDetails from "./pages/Home/HomeProductDetails";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AddProduct from "./pages/AddProduct";
import SignIn from "./pages/SignIn/SignIn";

const linkStyle = {
  marginRight: "15px",
  textDecoration: "none",
  color: "#1e40af",
  fontWeight: "600",
  padding: "8px 12px",
  borderRadius: "6px",
  backgroundColor: "#e0f2fe",
  transition: "background-color 0.3s ease, color 0.3s ease",
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proveri trenutno ulogovanog korisnika
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        {user && (
          <nav style={{ marginBottom: "20px" }}>
            <Link to="/home" style={linkStyle}>Home</Link>
            <Link to="/add" style={linkStyle}>Add Product</Link>
          </nav>
        )}

        <Routes>
          {!user ? (
            <>
              <Route path="*" element={<SignIn />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/add" />} />
              <Route path="/home" element={<Home />} />
              <Route path="/home-product/:id" element={<HomeProductDetails />} />
              <Route path="/add" element={<AddProduct table="products" />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="*" element={<Navigate to="/add" />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
