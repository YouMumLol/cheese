import { useState } from "react";
import { convertFile, ConversionResult } from "./helpers/convert";
import "./App.css";

function App() {
  const [imageData, setImageData] = useState<ConversionResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await convertFile(file);
        setImageData(result);
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }
  };

  const handleDownload = () => {
    if (imageData) {
      const a = document.createElement("a");
      a.href = imageData.downloadUrl;
      a.download = imageData.outputFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleReset = () => {
    setImageData(null);
    // Reset the file input
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <>
      <h1>Cheese Machine</h1>
      <div className="card">
        {!imageData && (
          <div className="file-input-container">
            <input
              type="file"
              accept=".jpg,.cheese"
              onChange={handleFileChange}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              Choose a file
              <span className="file-input-text">
                .jpg or .cheese files only
              </span>
            </label>
          </div>
        )}
        {imageData && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <div
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                overflow: "auto",
                marginBottom: "20px",
              }}
            >
              <canvas
                ref={(node) => {
                  if (node && imageData.canvas) {
                    const context = node.getContext("2d");
                    node.width = imageData.canvas.width;
                    node.height = imageData.canvas.height;
                    context?.drawImage(imageData.canvas, 0, 0);
                  }
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </div>
            <div className="button-container">
              <button onClick={handleDownload} className="download-button">
                Download
              </button>
              <button onClick={handleReset} className="reset-button">
                Choose Another File
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="read-the-docs">Open your cheese</p>
    </>
  );
}

export default App;
