import { useState, useEffect } from "react";
import CarouselManager from "./CarouselManager";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Import the CSS file

function Home() {
  const [activeTab, setActiveTab] = useState("products");
  const [homeProducts, setHomeProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const fetchHomeProducts = async () => {
    const { data, error } = await supabase.from("home_products").select();
    if (error) console.error("Error fetching home products:", error);
    else setHomeProducts(data);
  };

  const handleUploadProduct = async () => {
    if (!name || !price || !description || !file) {
      alert("Please fill in all fields and upload an image.");
      return;
    }

    const { data: insertData, error: insertError } = await supabase
      .from("home_products")
      .insert([{ name, price, description }])
      .select()
      .single();

    if (insertError) return console.error("Insert failed:", insertError);

    const productId = insertData.id;
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}_${Date.now()}.${fileExt}`;

    // Set up a progress listener
    const { error: uploadError } = await supabase.storage.from("images").upload(
      fileName,
      file,
      { upsert: true },
      {
        onUploadProgress: (progress) => {
          setUploadProgress(
            Math.round((progress.loaded / progress.total) * 100)
          );
        },
      }
    );

    if (uploadError) return console.error("Image upload failed:", uploadError);

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("home_products")
      .update({ image_url: imageUrl })
      .eq("id", productId);

    if (updateError)
      return console.error("Update image_url failed:", updateError);

    // Clear the form fields
    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
    setUploadProgress(0);

    // Reload the products
    fetchHomeProducts();
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
    <div className="home-container">
      <h2>Home</h2>

      {/* Product Upload Form */}
      <div className="product-upload-form">
        <h3>Upload New Product</h3>
        <input
          type="text"
          className="form-input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <textarea
          className="form-input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Custom File Input */}
        <div className="file-input-container">
          <input
            type="file"
            id="file-upload"
            className="file-input"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label htmlFor="file-upload" className="file-upload-label">
            Choose a file
          </label>
        </div>

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span>{uploadProgress}%</span>
          </div>
        )}

        <button className="upload-button" onClick={handleUploadProduct}>
          Upload Product
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`tab-button ${activeTab === "carousel" ? "active" : ""}`}
          onClick={() => setActiveTab("carousel")}
        >
          Carousel
        </button>
      </div>

      {/* Content */}
      {activeTab === "products" && (
        <div className="products-list">
          {homeProducts.map((item) => (
            <div key={item.id} className="product-card">
              <img
                src={item.image_url}
                alt={item.name}
                className="product-image"
              />
              <h4 className="product-name">{item.name}</h4>
              <p className="product-price">{item.price} RSD</p>
              <button
                className="product-button"
                onClick={() => navigate(`/home-product/${item.id}`)}
              >
                Add Thumbnails
              </button>
              <button
                className="product-button"
                onClick={() => {
                  setEditingProduct(item);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </button>
              <button
                className="product-button delete-button"
                onClick={() => handleDeleteProduct(item.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "carousel" && <CarouselManager />}
    </div>
  );
}

export default Home;
