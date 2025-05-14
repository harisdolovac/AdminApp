import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { compressImage } from "../utilis/imageCompression";
import "../styles/admin.css";

export default function AdminProductDetails() {
  const navigate = useNavigate();
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

    // Compress the thumbnail image
    const compressedFile = await compressImage(file, true);

    const fileName = `${id}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, compressedFile);

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("images")
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
      .from("images")
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
    <div className="admin-container">
      <div className="admin-header">
        <div className="flex items-center justify-between">
          <h1 className="admin-title">Product Details</h1>
          <button
            onClick={() => window.history.back()}
            className="btn btn-secondary"
            type="button"
          >
            Back
          </button>
        </div>
      </div>

      <div className="form-container">
        <div className="form-group">
          <h2 className="card-title">{product.name}</h2>
          <p className="product-price">${product.price}</p>
          <p className="text-secondary">{product.description}</p>
        </div>

        <div className="upload-container">
          <img
            src={mainImage}
            alt="Main product image"
            className="preview-image"
          />
          <p className="text-secondary mt-2">Click on any thumbnail below to set as main image</p>
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Product Thumbnails</h3>
            <span className="text-secondary">{thumbnails.length} images</span>
          </div>

          <div className="file-input-container">
            <input
              type="file"
              id="thumbnail-upload"
              accept="image/*"
              onChange={handleAddThumbnail}
              ref={fileInputRef}
              className="file-input"
              aria-label="Upload thumbnail"
            />
            <label htmlFor="thumbnail-upload">
              Choose Image for Thumbnail
            </label>
          </div>

          <div className="carousel-list">
            {thumbnails.map((url, idx) => (
              <div key={idx} className="carousel-item-container">
                <div className="carousel-item">
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    onClick={() => setMainImage(url)}
                    style={{ cursor: "pointer" }}
                  />
                </div>
                <button
                  onClick={() => handleDeleteThumbnail(url)}
                  className="btn btn-danger"
                  title="Delete thumbnail"
                  aria-label="Delete thumbnail"
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
