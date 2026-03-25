import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import itemsRouter from "./items";
import claimsRouter from "./claims";
import adminRouter from "./admin";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/items", itemsRouter);
router.use("/claims", claimsRouter);
router.use("/admin", adminRouter);
router.use("/chat", chatRouter);

export default router;
