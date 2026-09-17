import { Router } from "express";
import { clearConversation, listInbox, listMessages, sendMessage } from "../controllers/chat.controller.js";
import { validate } from "../middlewares/http.js";
import { chatSendSchema } from "../validators/chat.schema.js";

export const chatRouter = Router();

chatRouter.get("/inbox", listInbox);
chatRouter.post("/send", validate(chatSendSchema), sendMessage);
chatRouter.get("/:userId/messages", listMessages);
chatRouter.delete("/:userId/messages", clearConversation);