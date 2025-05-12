import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home/Home";
import HomeProductDetails from "./pages/Home/HomeProductDetails";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AddProduct from "./pages/AddProduct";

function App() {
  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <nav style={{ marginBottom: "20px" }}>
          <Link to="/home" style={{ marginRight: "15px" }}>
            Home
          </Link>
          <Link to="/add" style={{ marginRight: "15px" }}>
            Add Product
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/add" />} />
          {/* home_products flow */}
          <Route path="/home" element={<Home />} />
          <Route path="/home-product/:id" element={<HomeProductDetails />} />

          {/* products flow */}
          <Route path="/add" element={<AddProduct table="products" />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
