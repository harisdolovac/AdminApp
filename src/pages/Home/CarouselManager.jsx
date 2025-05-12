// components/CarouselManager.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

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
    <div>
      <h3>Carousel Image Manager</h3>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br />
      <br />
      <button onClick={handleUpload} disabled={images.length >= 5}>
        Upload Image
      </button>
      {images.length >= 5 && (
        <p style={{ color: "red" }}>Max 5 images allowed in this carousel.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {images.map((img) => {
          const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(img.name)
            .data.publicUrl;
          return (
            <li key={img.name} style={{ marginBottom: "15px" }}>
              <img src={publicUrl} alt={img.name} width={120} />
              <br />
              <button
                onClick={() => handleDelete(img.name)}
                style={{ color: "red", marginTop: "5px" }}
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default CarouselManager;
