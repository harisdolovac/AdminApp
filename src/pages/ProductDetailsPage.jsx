import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function AdminProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select()
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
      } else {
        setProduct(data);
        const thumbs = Array.isArray(data.thumbnails) ? data.thumbnails : [];
        setThumbnails(thumbs);
        setMainImage(data.image_url);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${id}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("product-thumbnails")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-thumbnails")
      .getPublicUrl(fileName);

    const newThumbnailUrl = urlData.publicUrl;
    const updatedThumbnails = [...thumbnails, newThumbnailUrl];

    const { error: updateError } = await supabase
      .from("products")
      .update({ thumbnails: updatedThumbnails })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating product with thumbnail:", updateError);
    } else {
      setThumbnails(updatedThumbnails);
    }
  };

  const handleDeleteThumbnail = async (thumbUrl) => {
    const path = thumbUrl.split("/").slice(-1)[0];
    const { error: deleteError } = await supabase.storage
      .from("product-thumbnails")
      .remove([path]);

    if (deleteError) {
      console.error("Error deleting thumbnail from storage:", deleteError);
      return;
    }

    const updatedThumbnails = thumbnails.filter((url) => url !== thumbUrl);

    const { error: updateError } = await supabase
      .from("products")
      .update({ thumbnails: updatedThumbnails })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating product thumbnails:", updateError);
    } else {
      setThumbnails(updatedThumbnails);
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>
        <strong>{product.price} RSD</strong>
      </p>

      <div style={{ marginBottom: "20px" }}>
        <img
          src={mainImage}
          alt="Main product"
          style={{
            width: "100%",
            maxHeight: "400px",
            objectFit: "contain",
            borderRadius: "10px",
          }}
        />
      </div>

      <h3>Thumbnails</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {thumbnails.map((url, idx) => (
          <div key={idx} style={{ position: "relative" }}>
            <img
              src={url}
              alt={`Thumbnail ${idx + 1}`}
              onClick={() => setMainImage(url)}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                cursor: "pointer",
                border: mainImage === url ? "2px solid blue" : "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
            <button
              onClick={() => handleDeleteThumbnail(url)}
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleAddThumbnail}
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileInputRef.current.click()}
        style={{ marginTop: "20px", padding: "10px 20px" }}
      >
        Upload Thumbnail
      </button>
    </div>
  );
}
