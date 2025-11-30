import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
} from "../Controllers/history.js";

const routes = express.Router();
routes.get("/:userId", getallhistoryVideo);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", handlehistory);
export default routes;