import { useState, useEffect } from "react";
import CarouselManager from "./CarouselManager";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";


function Home() {
  const [activeTab, setActiveTab] = useState("products");
  const [homeProducts, setHomeProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const fetchHomeProducts = async () => {
    const { data, error } = await supabase.from("home_products").select();
    if (error) console.error("Error fetching home products:", error);
    else setHomeProducts(data);
  };

  const handleEditProduct = async (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setDescription(product.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateProduct = async () => {
    if (!name || !price || !description) {
      alert("Please fill in all fields.");
      return;
    }

    const updates = { name, price, description };
    
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${editingProduct.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(
        fileName,
        file,
        { upsert: true }
      );

      if (uploadError) return console.error("Image upload failed:", uploadError);

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      updates.image_url = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("home_products")
      .update(updates)
      .eq("id", editingProduct.id);

    if (updateError) {
      console.error("Update failed:", updateError);
      return;
    }

    // Clear form and reset state
    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
    setEditingProduct(null);
    setUploadProgress(0);

    // Reload products
    fetchHomeProducts();
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

  const openDeleteModal = (productId) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await handleDeleteProduct(productToDelete);
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-container">

      <div className="admin-header">
        <div className="flex items-center justify-between">
          <h1 className="admin-title">Home</h1>
          <div className="tabs">
            <button
              onClick={() => setActiveTab("products")}
              className={`btn ${activeTab === "products" ? "btn-primary" : "btn-secondary"}`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("carousel")}
              className={`btn ${activeTab === "carousel" ? "btn-primary" : "btn-secondary"}`}
            >
              Carousel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "products" ? (
        <>
          {/* Product Form */}
          <div className="product-upload-form">
            <div className="flex items-center justify-between mb-4">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              {editingProduct && (
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingProduct(null);
                    setName("");
                    setPrice("");
                    setDescription("");
                    setFile(null);
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
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
              className="form-textarea"
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
              <label htmlFor="file-upload">
                Choose Product Image
              </label>
              {file && (
              <div className="image-selected-message">
                <p>Image selected. Now press Add Product</p>
              </div>
            )}
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

            <button 
              className="btn btn-primary" 
              onClick={editingProduct ? handleUpdateProduct : handleUploadProduct}
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>

          <div className="grid">
            {homeProducts.map((item) => (
              <div key={item.id} className="card">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="card-image"
                />
                <div className="card-content">
                  <h4 className="card-title">{item.name}</h4>
                  <p className="product-price">${item.price}</p>
                  <div className="btn-group">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/home-product/${item.id}`)}
                    >
                      Add Thumbnails
                    </button>
                    <div className="btn-secondary-container">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEditProduct(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => openDeleteModal(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <CarouselManager />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Delete</h3>
            <p>Are you sure you want to delete this product?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
