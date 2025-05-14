import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { compressImage } from "../utilis/imageCompression";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";


function AddProduct({ table = "products" }) {
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    const { data, error } = await supabase.from(table).select("*");
    if (error) return console.error("Fetch failed:", error);
    setProducts(data);
  }

  async function handleUpload() {
    if (!file || !name || !price || !description) {
      alert("Please fill all fields and select an image.");
      return;
    }

    const { data: insertData, error: insertError } = await supabase
      .from(table)
      .insert([{ name, price, description }])
      .select()
      .single();

    if (insertError) return console.error("Insert failed:", insertError);

    const productId = insertData.id;
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, compressedFile, { upsert: true });

    if (uploadError) return console.error("Image upload failed:", uploadError);

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from(table)
      .update({ image_url: imageUrl })
      .eq("id", productId);

    if (updateError)
      return console.error("Update image_url failed:", updateError);

    // Fetch the newly added product
    const { data: newProduct, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", productId)
      .single();

    if (fetchError) return console.error("Fetch failed:", fetchError);

    // Add the new product to the beginning of the list
    setProducts((prevProducts) => [newProduct, ...prevProducts]);
    resetForm();
  }

  async function handleUpdate() {
    if (!name || !price || !description) {
      alert("Please fill all fields.");
      return;
    }

    const updates = { name, price, description };

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${editingId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError)
        return console.error("Image upload failed:", uploadError);

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      updates.image_url = urlData.publicUrl;
    }

    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", editingId);

    if (error) return console.error("Update failed:", error);

    // Fetch the updated product and add to the list
    const { data: updatedProduct, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", editingId)
      .single();

    if (fetchError) return console.error("Fetch failed:", fetchError);

    // Add the updated product to the beginning of the list
    setProducts((prevProducts) => [updatedProduct, ...prevProducts.filter(product => product.id !== editingId)]);
    resetForm();
    alert("Product updated successfully!");
  }

  async function deleteProduct(id) {
    const { data } = await supabase
      .from(table)
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

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) console.error("Delete failed:", error);
    else getProducts();
  }

  const openDeleteModal = (id) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setProductToDelete(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      const { error: deleteError } = await supabase.from(table).delete().eq("id", productToDelete);
      if (deleteError) console.error("Delete failed:", deleteError);
      else getProducts();
      closeDeleteModal();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Compress the main product image
    const compressedFile = await compressImage(file, false);
    setFile(file);
    setCompressedFile(compressedFile);
  };

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
    setCompressedFile(null);
    setEditingId(null);
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="flex items-center justify-between">
          <h1 className="admin-title">Products</h1>
        </div>
      </div>

      <div className="product-upload-form">
        <h3>Add New Product</h3>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            className="form-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
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
          <div className="file-input-container">
            <input
              type="file"
              id="product-image"
              onChange={handleImageUpload}
              accept="image/*"
              className="file-input"
              style={{ display: 'none' }}
            />
            <label htmlFor="product-image" className="file-label">
              Choose Image
            </label>
            {file && (
              <div className="image-selected-message">
                <p>Image selected. Now press Add Product</p>
              </div>
            )}
          </div>
          <div className="btn-group">
            <button
              type="submit"
              className={`btn ${editingId ? 'btn-secondary' : 'btn-primary'}`}
              onClick={editingId ? handleUpdate : handleUpload}
            >
              {editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button 
                className="btn btn-danger" 
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid">
        {products.map((product) => (
          <div key={product.id} className="card">
            <img
              src={product.image_url || 'https://via.placeholder.com/300'}
              alt={product.name}
              className="card-image"
            />
            <div className="card-content">
              <h4 className="card-title">{product.name}</h4>
              <p className="product-price">${product.price}</p>
              <p className="text-secondary">{product.description}</p>
              <div className="btn-group">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingId(product.id);
                    setName(product.name);
                    setPrice(product.price);
                    setDescription(product.description);
                    setFile(null);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => openDeleteModal(product.id)}
                >
                  Delete
                </button>
                {table === "products" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    Thumbnails
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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

export default AddProduct;
