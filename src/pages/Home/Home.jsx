import { useState, useEffect } from "react";
import CarouselManager from "./CarouselManager";
import AddProduct from "../AddProduct";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

function Home() {
  const [activeTab, setActiveTab] = useState("products");
  const [homeProducts, setHomeProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const fetchHomeProducts = async () => {
    const { data, error } = await supabase.from("home_products").select();
    if (error) console.error("Error fetching home products:", error);
    else setHomeProducts(data);
  };

  const handleDeleteProduct = async (id) => {
    const { data } = await supabase
      .from("home_products")
      .select("image_url, thumbnails")
      .eq("id", id)
      .single();

    const urls = [data?.image_url, ...(data?.thumbnails || [])];
    for (const url of urls) {
      if (url) {
        const fileName = url.split("/").pop();
        await supabase.storage.from("images").remove([fileName]);
      }
    }

    const { error } = await supabase
      .from("home_products")
      .delete()
      .eq("id", id);
    if (error) console.error("Delete failed:", error);
    else fetchHomeProducts();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Home</h2>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("products")}
          style={{
            marginRight: "10px",
            backgroundColor: activeTab === "products" ? "#007BFF" : "#ccc",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Products
        </button>
        <button
          onClick={() => setActiveTab("carousel")}
          style={{
            backgroundColor: activeTab === "carousel" ? "#007BFF" : "#ccc",
            color: "white",
            padding: "10px",
            border: "none",
            borderRadius: "5px",
          }}
        >
          Carousel
        </button>
      </div>

      {/* Content */}
      {activeTab === "products" && (
        <>
          <AddProduct
            table="home_products"
            onAdd={fetchHomeProducts}
            editingProduct={editingProduct}
            clearEditing={() => setEditingProduct(null)}
          />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              marginTop: "40px",
            }}
          >
            {homeProducts.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #ccc",
                  padding: "10px",
                  width: "220px",
                  borderRadius: "10px",
                }}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <h4 style={{ margin: "10px 0 5px" }}>{item.name}</h4>
                <p>{item.price} RSD</p>
                <button onClick={() => navigate(`/home-product/${item.id}`)}>
                  Add Thumbnails
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(item);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{ marginTop: "5px" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(item.id)}
                  style={{ marginTop: "5px", color: "red" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "carousel" && <CarouselManager />}
    </div>
  );
}

export default Home;
