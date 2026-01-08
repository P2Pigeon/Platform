"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notifications = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const NotificationItem_1 = require("./NotificationItem");
const Notifications = ({ notifications }) => ((0, jsx_runtime_1.jsx)("div", { style: { position: 'fixed', top: 24, right: 24, zIndex: 10000 }, children: notifications.map((n) => ((0, jsx_runtime_1.jsx)(NotificationItem_1.NotificationItem, { message: n.message, type: n.type }, n.id))) }));
exports.Notifications = Notifications;
