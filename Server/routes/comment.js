import express from "express";
import { deletecomment, getallcomment, postComment, editComment, likeComment, dislikeComment} from "../Controllers/comment.js";

const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", postComment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editComment);
routes.post("/likecomment/:id", likeComment);
routes.post("/dislikecomment/:id", dislikeComment);

export default routes;