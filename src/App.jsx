import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import AddProduct from "./pages/AddProduct";
import ProductDetailsPage from "./pages/ProductDetailsPage";

function App() {
  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <nav style={{ marginBottom: "20px" }}>
          <Link to="/home" style={{ marginRight: "15px" }}>
            Home
          </Link>
          <Link to="/add">Add Product</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/add" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/add" element={<AddProduct />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
