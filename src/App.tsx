import { useState, type FormEvent, type ChangeEvent } from "react";
import "./index.css";

// 🔥 Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Types
type Result = {
  sentiment: string;
  confidence: number;
  accuracy: number;
  confusion_matrix: number[][];
};

type ComparisonItem = {
  model: string;
  sentiment: string;
  confidence: number;
  accuracy: number;
  confusion_matrix: number[][];
};

export default function App() {
  const [review, setReview] = useState<string>("");
  const [model, setModel] = useState<string>("logistic");
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [result, setResult] = useState<Result>({
    sentiment: "",
    confidence: 0,
    accuracy: 0,
    confusion_matrix: [],
  });

  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [graph, setGraph] = useState<string>("");

  // 🔥 Heatmap color function
  const getHeatmapColor = (value: number, max: number) => {
    const intensity = value / max;
    return `rgba(0, 123, 255, ${intensity})`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ review, model }),
      });

      const data = await response.json();

      if (response.ok) {
        if (model === "all") {
          setComparison(data.comparison);
          setGraph(data.graph);
          setResult({
            sentiment: "",
            confidence: 0,
            accuracy: 0,
            confusion_matrix: [],
          });
        } else {
          setResult({
            sentiment: data.sentiment,
            confidence: data.confidence,
            accuracy: data.accuracy,
            confusion_matrix: data.confusion_matrix,
          });
          setComparison([]);
          setGraph("");
        }
        setHasSubmitted(true);
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="blob blob1" />
      <div className="blob blob2" />

      <main className="container">
        <header className="header fade-up">
          <h1 className="title">Movie Review Analyzer</h1>
          <p className="subtitle">
            Analyze sentiment using multiple ML models and compare results.
          </p>
        </header>

        <section className="card fade-up">
          <form className="form" onSubmit={handleSubmit}>
            
            <label htmlFor="review" className="label">Enter Movie Review</label>
            <textarea
              id="review"
              value={review}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReview(e.target.value)}
              className="textarea"
            />

            <label className="label">Select Model</label>
            <select
              className="select"
              value={model}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)}
            >
              <option value="logistic">Logistic Regression</option>
              <option value="svm">SVM</option>
              <option value="naive_bayes">Naive Bayes</option>
              <option value="all">All (Compare)</option>
            </select>

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Review"}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setReview("");
                  setHasSubmitted(false);
                  setResult({
                    sentiment: "",
                    confidence: 0,
                    accuracy: 0,
                    confusion_matrix: [],
                  });
                  setComparison([]);
                  setGraph("");
                }}
              >
                Clear
              </button>
            </div>
          </form>

          <aside className="prediction">
            <p className="pred-label">PREDICTION</p>

            {hasSubmitted ? (
              model === "all" ? (
                <div className="comparison">

                  {/* Cards */}
                  {comparison.map((item, index) => (
                    <div key={index} className="comparison-item">
                      <p className="model-name">{item.model.toUpperCase()}</p>
                      <p className={`pred-value ${item.sentiment === "Positive" ? "positive" : "negative"}`}>
                        {item.sentiment}
                      </p>
                      <p>Confidence: {item.confidence}%</p>
                      <p>Accuracy: {item.accuracy}%</p>
                    </div>
                  ))}

                  {/* Confidence Chart */}
                  <h3>Confidence Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="confidence" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Accuracy Chart */}
                  <h3>Accuracy Comparison</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={comparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="model" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="accuracy" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Heatmap Confusion Matrix */}
                  <h3>Confusion Matrix</h3>
                  {comparison.map((item, index) => (
                    <div key={index}>
                      <p>{item.model}</p>
                      <table>
                        <tbody>
                          {item.confusion_matrix.map((row, r) => (
                            <tr key={r}>
                              {row.map((val, c) => (
                                <td
                                  key={c}
                                  style={{
                                    backgroundColor: getHeatmapColor(
                                      val,
                                      Math.max(...item.confusion_matrix.flat())
                                    ),
                                    color: val > 0 ? "#fff" : "#51c1c1",
                                    padding: "8px",
                                    border: "1px solid #ccc",
                                  }}
                                >
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}

                </div>
              ) : (
                <div className="pred-body">
                  <p className={`pred-value ${result.sentiment === "Positive" ? "positive" : "negative"}`}>
                    {result.sentiment}
                  </p>
                  <p>Confidence: {result.confidence}%</p>
                  <p>Accuracy: {result.accuracy}%</p>

                  {/* Heatmap for single model */}
                  <h4>Confusion Matrix</h4>
                  <table>
                    <tbody>
                      {result.confusion_matrix.map((row, r) => (
                        <tr key={r}>
                          {row.map((val, c) => (
                            <td
                              key={c}
                              style={{
                                backgroundColor: getHeatmapColor(
                                  val,
                                  Math.max(...result.confusion_matrix.flat())
                                ),
                                color: val > 0 ? "#fff" : "#000",
                                padding: "8px",
                                border: "1px solid #ccc",
                              }}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <p className="pred-empty">Submit a review to see results</p>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}