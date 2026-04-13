import express from "express";
import { login } from "../Controllers/user.js";

const routes = express.Router();
routes.post("/login", login);

export default routes;