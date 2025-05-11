// pages/Home.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

const BUCKETS = ["carousel", "carousel2"];

function Home() {
  const [activeTab, setActiveTab] = useState("carousel");
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, [activeTab]);

  async function fetchImages() {
    const { data, error } = await supabase.storage.from(activeTab).list("", {
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
      .from(activeTab)
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error("Upload failed:", error);
    } else {
      setFile(null);
      fetchImages();
    }
  }

  async function handleDelete(fileName) {
    const { error } = await supabase.storage.from(activeTab).remove([fileName]);
    if (error) {
      console.error("Delete failed:", error);
    } else {
      fetchImages();
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Home – Carousel Image Manager</h2>

      {/* Tab Switcher */}
      <div style={{ marginBottom: "20px" }}>
        {BUCKETS.map((bucket) => (
          <button
            key={bucket}
            onClick={() => setActiveTab(bucket)}
            style={{
              marginRight: "10px",
              fontWeight: activeTab === bucket ? "bold" : "normal",
              backgroundColor: activeTab === bucket ? "#ddd" : "#f7f7f7",
              border: "1px solid #ccc",
              padding: "5px 10px",
              borderRadius: "5px",
            }}
          >
            {bucket.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Upload */}
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br />
      <br />
      <button onClick={handleUpload} disabled={images.length >= 5}>
        Upload Image
      </button>
      {images.length >= 5 && (
        <p style={{ color: "red" }}>Max 5 images allowed in this carousel.</p>
      )}

      {/* Image List */}
      <h3 style={{ marginTop: "30px" }}>
        {activeTab.toUpperCase()} Images ({images.length}/5)
      </h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {images.map((img) => {
          const publicUrl = supabase.storage
            .from(activeTab)
            .getPublicUrl(img.name).data.publicUrl;
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

export default Home;
