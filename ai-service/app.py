from flask import Flask, jsonify

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify(status="ok", service="ai-service")


def _not_implemented(name: str):
    return (
        jsonify(
            status="not_implemented",
            feature=name,
            message="Reservado para Fase 2 (IA).",
        ),
        501,
    )


@app.post("/recommendations")
def recommendations():
    return _not_implemented("recommendations")


@app.post("/chat")
def chat():
    return _not_implemented("chat")


@app.post("/suggest-list")
def suggest_list():
    return _not_implemented("suggest-list")


@app.post("/predict-next-purchase")
def predict_next_purchase():
    return _not_implemented("predict-next-purchase")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
