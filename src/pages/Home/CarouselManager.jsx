// components/CarouselManager.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "../../styles/admin.css";

const BUCKET = "carousel";

function CarouselManager() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "asc" },
    });

    if (error) {
      console.error("Error listing images:", error);
    } else {
      setImages(data);
    }
  }

  async function handleUpload() {
    if (!file) {
      alert("Select an image first.");
      return;
    }

    if (images.length >= 5) {
      alert("You can only upload up to 5 images in this carousel.");
      return;
    }

    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error("Upload failed:", error);
    } else {
      setFile(null);
      fetchImages();
    }
  }

  async function handleDelete(fileName) {
    const { error } = await supabase.storage.from(BUCKET).remove([fileName]);
    if (error) {
      console.error("Delete failed:", error);
    } else {
      fetchImages();
    }
  }

  return (
    <div className="admin-content">
      <div className="product-upload-form">
        <h3>Carousel Image Manager</h3>
        <p className="text-secondary mb-4">
          Upload images to display in the homepage carousel. Maximum 5 images allowed.
        </p>

        <div className="file-input-container">
          <input
            type="file"
            id="carousel-upload"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="file-input"
            aria-label="Upload carousel image"
          />
          <label htmlFor="carousel-upload">
            Choose Image for Carousel
          </label>
        </div>

        <button 
          onClick={handleUpload} 
          disabled={images.length >= 5}
          className="btn btn-primary mt-4"
        >
          Upload Image
        </button>

        {images.length >= 5 && (
          <p className="text-danger mt-2">
            Maximum number of images reached (5/5)
          </p>
        )}

        <div className="carousel-list mt-6">
          {images.map((img) => {
            const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(img.name)
              .data.publicUrl;
            return (
              <div key={img.name} className="carousel-item">
                <img src={publicUrl} alt={img.name} />
                <button
                  onClick={() => handleDelete(img.name)}
                  className="btn-delete"
                  title="Delete image"
                  aria-label="Delete carousel image"
                  type="button"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CarouselManager;
