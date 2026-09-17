import math
import random


def sigmoid(x):
    return 1 / (1 + math.exp(-x))


def sigmoid_derivative(x):
    return x * (1 - x)


class NeuralNetwork:
    """Red neuronal mínima: 2 entradas -> 1 neurona de salida."""

    def __init__(self, learning_rate=0.1):
        self.weights = [random.uniform(-1, 1), random.uniform(-1, 1)]
        self.bias = random.uniform(-1, 1)
        self.learning_rate = learning_rate

    def predict(self, inputs):
        total = (
            inputs[0] * self.weights[0]
            + inputs[1] * self.weights[1]
            + self.bias
        )
        return sigmoid(total)

    def train(self, inputs, expected):
        prediction = self.predict(inputs)
        error = expected - prediction
        adjustment = error * sigmoid_derivative(prediction)

        self.weights[0] += inputs[0] * adjustment * self.learning_rate
        self.weights[1] += inputs[1] * adjustment * self.learning_rate
        self.bias += adjustment * self.learning_rate

    def fit(self, data, epochs=10_000):
        for _ in range(epochs):
            for inputs, expected in data:
                self.train(inputs, expected)


if __name__ == "__main__":
    # Tabla de verdad AND
    data = [
        ([0, 0], 0),
        ([0, 1], 0),
        ([1, 0], 0),
        ([1, 1], 1),
    ]

    brain = NeuralNetwork()
    brain.fit(data)

    for inputs, expected in data:
        prediction = brain.predict(inputs)
        print(f"{inputs} -> {prediction:.4f} (esperado: {expected})")
