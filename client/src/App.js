import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Header from "./components/Header";

const App = () => {
    const [image, setImage] = useState(null);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image) {
            alert("Please select an image to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);

        try {
            setLoading(true);
            const res = await axios.post("http://localhost:5000/analyze-image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setResponse(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error uploading image:", error);
            setLoading(false);
            alert("There was an error uploading the image. Please try again.");
        }
    };

    return (
        <div className="App container mt-5">
            {/* Add Header component here */}
            <Header />
            <div className="card shadow-lg p-4">
                <h1 className="text-center mb-4">Foundation Shade Finder</h1>
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="mb-3">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="form-control"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        {loading ? "Analyzing..." : "Analyze Image"}
                    </button>
                </form>

                {loading && <p className="text-center">Analyzing image...</p>}

                {response && (
                    <div className="result card p-3">
                        <h2>Results</h2>
                        <p>
                            <strong>Detected Color:</strong>{" "}
                            <span
                                style={{
                                    backgroundColor: response.detectedColor,
                                    padding: "5px 10px",
                                    borderRadius: "5px",
                                    color: "#fff",
                                }}
                            >
                                {response.detectedColor}
                            </span>
                        </p>
                        <p>
                            <strong>Recommended Foundation Shade:</strong>{" "}
                            {response.closestShade ? (
                                <>
                                    {response.closestShade.brand} - {response.closestShade.shade}
                                </>
                            ) : (
                                "No match found."
                              )}
                              </p>
                          </div>
                      )}
                  </div>
              </div>
          );
      };
      
      export default App;
