export interface ConversionResult {
  canvas: HTMLCanvasElement;
  downloadUrl: string;
  outputFileName: string;
}

export const convertFile = async (file: File): Promise<ConversionResult> => {
  const fileReader = new FileReader();

  return new Promise<ConversionResult>((resolve, reject) => {
    fileReader.onload = async (event: ProgressEvent<FileReader>) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }

      const arrayBuffer = event.target.result as ArrayBuffer;
      const buffer = new Uint8Array(arrayBuffer);
      const fileName = file.name;
      let outputFileName: string;

      console.log("File loaded:", fileName);

      try {
        if (fileName.endsWith(".jpg")) {
          // Convert .jpg to .cheese
          outputFileName = fileName.replace(".jpg", ".cheese");
          console.log("Starting conversion from .jpg to .cheese");

          const img = new Image();
          const blob = new Blob([buffer], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);

          console.log("Image Blob created:", url);

          img.onload = () => {
            console.log("Image loaded successfully.");

            // Use canvas to manipulate the image
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get raw pixel data (RGBA format)
            const pixelData = ctx.getImageData(0, 0, img.width, img.height).data;
            
            // Convert RGBA to RGB
            const rgb = new Uint8Array(img.width * img.height * 3);
            for (let i = 0, j = 0; i < pixelData.length; i += 4, j += 3) {
              rgb[j] = pixelData[i];      // R
              rgb[j + 1] = pixelData[i + 1]; // G
              rgb[j + 2] = pixelData[i + 2]; // B
              // Skip alpha channel
            }

            // Prepare the header (magic number + width + height)
            const headerBuffer = new ArrayBuffer(14);
            const headerView = new DataView(headerBuffer);
            const encoder = new TextEncoder();

            // Magic number: "CHEESE"
            encoder.encodeInto("CHEESE", new Uint8Array(headerBuffer));

            // Write width and height
            headerView.setUint32(6, img.width, false); // big-endian
            headerView.setUint32(10, img.height, false); // big-endian

            // Combine header and pixel data
            const fullData = new Uint8Array(headerBuffer.byteLength + rgb.length);
            fullData.set(new Uint8Array(headerBuffer), 0);
            fullData.set(rgb, headerBuffer.byteLength);

            // Create the .cheese file as a Blob
            const cheeseBlob = new Blob([fullData], {
              type: "application/octet-stream",
            });
            const downloadUrl = URL.createObjectURL(cheeseBlob);

            console.log("Cheese Blob created. URL:", downloadUrl);

            // Return both canvas and download URL instead of auto-downloading
            resolve({ canvas, downloadUrl, outputFileName });

            // Clean up: Revoke the object URL to free memory
            URL.revokeObjectURL(url); // Revoke the image Blob URL
          };

          img.onerror = (e) => {
            console.error("Error loading image:", e);
            reject(new Error("Error loading image"));
          };

          img.src = url;
        } else if (fileName.endsWith(".cheese")) {
          // Convert .cheese back to .jpg
          outputFileName = fileName.replace(".cheese", ".jpg");

          console.log("Starting conversion from .cheese to .jpg");

          // Read width and height from the header
          const magicNumber = new TextDecoder().decode(buffer.slice(0, 6));
          console.log("Magic number from .cheese file:", magicNumber);

          if (magicNumber !== "CHEESE") {
            console.error("Invalid .cheese file format.");
            throw new Error("Invalid .cheese file format.");
          }

          const width = new DataView(buffer.buffer).getUint32(6, false); // big-endian
          const height = new DataView(buffer.buffer).getUint32(10, false); // big-endian

          console.log("Width and Height from header:", width, height);
          console.log("Width * Height:", width * height);
          console.log("Width * Height * 4:", width * height * 4);

          // Extract raw pixel data
          const pixelData = buffer.slice(14);
          console.log("Pixel data length:", pixelData.byteLength);
          console.log("Buffer total length:", buffer.byteLength);
          console.log(
            "First few bytes of pixel data:",
            Array.from(pixelData.slice(0, 10))
          );

          // Calculate expected size for RGBA (4 bytes per pixel)
          const expectedSize = width * height * 4;
          console.log("Expected pixel data length:", expectedSize);

          // Check if pixelData is valid
          if (!pixelData || pixelData.byteLength === 0) {
            console.error("Invalid pixel data extracted.");
            reject(new Error("Invalid pixel data extracted."));
            return;
          }

          // Ensure pixelData length matches expected size
          if (pixelData.byteLength !== expectedSize) {
            console.error("Pixel data length does not match expected size.");
            reject(
              new Error("Pixel data length does not match expected size.")
            );
            return;
          }

          // RGBA data is already in the correct format, no conversion needed
          const rgbaData = new Uint8ClampedArray(pixelData);

          const imageData = new ImageData(rgbaData, width, height);

          // Create the .jpg file as a Blob
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.putImageData(imageData, 0, 0);

          // Create download URL
          const downloadUrl = canvas.toDataURL("image/jpeg");

          // Return both canvas and download URL
          resolve({ canvas, downloadUrl, outputFileName });
        } else {
          console.error(
            "Invalid file type. Please provide a .jpg or .cheese file."
          );
          reject(
            new Error(
              "Invalid file type. Please provide a .jpg or .cheese file."
            )
          );
        }
      } catch (error) {
        console.error("Error in conversion process:", error);
        reject(error);
      }
    };

    fileReader.onerror = (error: ProgressEvent<FileReader>) => {
      console.error("Error reading file:", error);
      reject(new Error(`Error reading file: ${error}`));
    };

    console.log("Starting to read file...");
    fileReader.readAsArrayBuffer(file);
  });
};