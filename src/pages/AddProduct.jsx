import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

function AddProduct({ table = "products" }) {
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts();
  }, []);

  async function getProducts() {
    const { data, error } = await supabase.from(table).select();
    if (error) console.error("Fetch failed:", error);
    else setProducts(data);
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
      .upload(fileName, file, { upsert: true });

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

    resetForm();
    getProducts();
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
        .upload(fileName, file, { upsert: true });

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

    resetForm();
    getProducts();
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

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
    setEditingId(null);
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <br />
      <br />
      <input
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <br />
      <br />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <br />
      <br />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br />
      <br />
      <button onClick={editingId ? handleUpdate : handleUpload}>
        {editingId ? "Update Product" : "Upload Product"}
      </button>
      {editingId && (
        <button
          onClick={resetForm}
          style={{ marginLeft: "10px", backgroundColor: "#ccc" }}
        >
          Cancel
        </button>
      )}

      <h2 style={{ marginTop: "40px" }}>Products</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {products.map((item) => (
          <li
            key={item.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "5px",
            }}
          >
            <strong>{item.name}</strong> - ${item.price}
            <br />
            <em>{item.description}</em>
            <br />
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                width={100}
                style={{ marginTop: "10px" }}
              />
            )}
            <br />
            <button
              onClick={() => deleteProduct(item.id)}
              style={{ color: "red", marginTop: "10px" }}
            >
              Delete
            </button>
            <button
              onClick={() => {
                setEditingId(item.id);
                setName(item.name);
                setPrice(item.price);
                setDescription(item.description);
                setFile(null);
              }}
              style={{ marginLeft: "10px", marginTop: "10px" }}
            >
              Edit
            </button>
            {table === "products" && (
              <button
                onClick={() => navigate(`/product/${item.id}`)}
                style={{ marginLeft: "10px", marginTop: "10px" }}
              >
                Add Thumbnails
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddProduct;
