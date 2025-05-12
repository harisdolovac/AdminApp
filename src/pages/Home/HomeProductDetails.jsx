import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "../../styles/admin.css";

export default function HomeProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [thumbnails, setThumbnails] = useState(() => {
    // Try to get thumbnails from localStorage first
    const cached = localStorage.getItem(`thumbnails_${id}`);
    return cached ? JSON.parse(cached) : [];
  });
  const [mainImage, setMainImage] = useState("");
  const fileInputRef = useRef();

  // Update localStorage whenever thumbnails change
  useEffect(() => {
    if (thumbnails.length > 0) {
      localStorage.setItem(`thumbnails_${id}`, JSON.stringify(thumbnails));
    }
  }, [thumbnails, id]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      try {
        console.log('Fetching product with ID:', id);
        const { data, error } = await supabase
          .from("home_products")
          .select('*')
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          console.error("No product found");
          return;
        }

        console.log('Fetched product data:', data);
        console.log('Thumbnails from DB:', data.thumbnails);

        if (isMounted) {
          setProduct(data);
          
          // Handle thumbnails with proper validation
          let thumbs = [];
          if (data.thumbnails) {
            if (typeof data.thumbnails === 'string') {
              try {
                // Try to parse if it's a JSON string
                thumbs = JSON.parse(data.thumbnails);
              } catch {
                console.error('Failed to parse thumbnails string');
              }
            } else if (Array.isArray(data.thumbnails)) {
              thumbs = data.thumbnails;
            }
          }

          // Ensure all thumbnails are valid URLs and not empty
          thumbs = thumbs.filter(url => url && typeof url === 'string' && url.trim() !== '');
          console.log('Processed thumbnails:', thumbs);

          if (thumbs.length > 0) {
            setThumbnails(thumbs);
            localStorage.setItem(`thumbnails_${id}`, JSON.stringify(thumbs));
          }

          // Set main image only if we don't already have one
          if (!mainImage) {
            setMainImage(data.image_url || (thumbs.length > 0 ? thumbs[0] : ''));
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    }
    
    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileName = `${id}_${Date.now()}_${file.name}`;
      console.log('Uploading file:', fileName);

      const { data, error } = await supabase.storage
        .from("product-thumbnails")
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("product-thumbnails")
        .getPublicUrl(fileName);

      const newThumbnailUrl = urlData.publicUrl;

      // Get current thumbnails from DB to ensure we have latest state
      const { data: currentProduct, error: fetchError } = await supabase
        .from("home_products")
        .select('thumbnails')
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Process existing thumbnails
      let existingThumbnails = [];
      if (currentProduct.thumbnails) {
        if (typeof currentProduct.thumbnails === 'string') {
          try {
            existingThumbnails = JSON.parse(currentProduct.thumbnails);
          } catch {
            console.error('Failed to parse existing thumbnails');
          }
        } else if (Array.isArray(currentProduct.thumbnails)) {
          existingThumbnails = currentProduct.thumbnails;
        }
      }

      // Filter out any invalid URLs and ensure we have an array
      existingThumbnails = Array.isArray(existingThumbnails) 
        ? existingThumbnails.filter(url => url && typeof url === 'string' && url.trim() !== '')
        : [];

      // Combine existing thumbnails with new one
      const updatedThumbnails = [...existingThumbnails, newThumbnailUrl];
      console.log('Updating thumbnails:', updatedThumbnails);

      const { error: updateError } = await supabase
        .from("home_products")
        .update({ thumbnails: updatedThumbnails })
        .eq("id", id);

      if (updateError) throw updateError;

      // Update both state and localStorage
      setThumbnails(updatedThumbnails);
      localStorage.setItem(`thumbnails_${id}`, JSON.stringify(updatedThumbnails));
    } catch (error) {
      console.error('Error in handleAddThumbnail:', error);
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
      .from("home_products")
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
          <h1 className="admin-title">Edit Product</h1>
          <div className="flex gap-2">
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
              type="button"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="form-container">
        <div className="form-group">
          <h2 className="card-title">{product.name}</h2>
          <p className="card-price">Price: ${product.price}</p>
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
            {thumbnails.map((url, index) => (
              <div key={index} className="carousel-item">
                <img
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  onClick={() => setMainImage(url)}
                  style={{ cursor: "pointer" }}
                />
                <button
                  onClick={() => handleDeleteThumbnail(url)}
                  className="btn-delete"
                  title="Delete thumbnail"
                  aria-label="Delete thumbnail"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
