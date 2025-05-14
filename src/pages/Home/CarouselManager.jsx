// components/CarouselManager.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import "../../styles/admin.css";

const BUCKET = "carousel";

function CarouselManager() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

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

  const openDeleteModal = (name) => {
    setImageToDelete(name);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setImageToDelete(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (imageToDelete) {
      const { error } = await supabase.storage.from(BUCKET).remove([imageToDelete]);
      if (error) console.error("Delete failed:", error);
      else fetchImages();
      closeDeleteModal();
    }
  };

  return (
    <div className="admin-content">
      <div className="product-upload-form">
        <h3>Carousel Image Manager</h3>
        <p className="text-secondary mb-4">
          Add or remove images in the homepage carousel. Maximum 5 images allowed.
        </p>

        <input
          type="file"
          id="carousel-upload"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files[0]);
            if (e.target.files[0]) handleUpload();
          }}
          style={{ display: 'none' }}
          aria-label="Upload carousel image"
        />

        <div className="carousel-list mt-4">
          {images.map((img) => {
            const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(img.name)
              .data.publicUrl;
            return (
              <div key={img.name} className="carousel-item-container">
                <div className="carousel-item">
                  <img src={publicUrl} alt={img.name} />
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => openDeleteModal(img.name)}
                >
                  Delete
                </button>
              </div>
            );
          })}

          {images.length < 5 && (
            <label 
              htmlFor="carousel-upload" 
              className="carousel-item add-item"
              role="button"
              aria-label="Add new carousel image"
            >
              <div className="add-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </div>
              <span>Add Image</span>
            </label>
          )}
        </div>

        {images.length >= 5 && (
          <p className="text-danger mt-4">
            Maximum number of images reached (5/5)
          </p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Delete</h3>
            <p>Are you sure you want to delete this image?</p>
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

export default CarouselManager;
