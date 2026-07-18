const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream")

socket.onopen = function (_) {
    let subscriptionMessage = {
        Apikey: "4b2f56b8da64f7263537d36687a81c2d1ce6f5b4",
        BoundingBoxes: [[[40.2, 28.10], [41.25, 29.2]]], // весь світ, щоб перевірити чи взагалі щось летить
        FilterMessageTypes: ["PositionReport"]
    }
    socket.send(JSON.stringify(subscriptionMessage));
    console.log('Підписку відправлено, чекаю повідомлень...');
};

socket.onmessage = function (event) {
    let aisMessage = JSON.parse(event.data)
    console.log(aisMessage)
};

socket.onerror = function (event) {
    console.log('WebSocket помилка:', event.message || event);
};

socket.onclose = function (event) {
    console.log('З\'єднання закрито. Code:', event.code, 'Reason:', event.reason);
};