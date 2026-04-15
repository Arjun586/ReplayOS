// 1 tab = 4 spaces as per Space instructions
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import { authenticateIngest } from "../middleware/traceIngest.middleware";
import {authorizeProjectAccess} from '../middleware/tenant.middleware';
import { 
    createTrace, 
    getProjectTraces, 
    getTraceById, 
    getTraceGraph,
    ingestOTLPTraces  
} from "../controllers/trace.controller";

const router = Router();

// ============================================================================
// 1. INGESTION ROUTE (NO COOKIE REQUIRED)
// ============================================================================
// Apply authenticateIngest strictly to this endpoint ONLY
router.post("/v1/traces", authenticateIngest, ingestOTLPTraces);

// ============================================================================
// 2. DASHBOARD ROUTES (COOKIE REQUIRED)
// ============================================================================
// Wrap all dashboard routes in their own authenticateUser middleware

router.use(authenticateUser);
router.post("/", authorizeProjectAccess, createTrace);
router.get("/", authorizeProjectAccess, getProjectTraces);
router.get("/:traceId/graph", authenticateUser, getTraceGraph);
router.get("/:traceId", authenticateUser, getTraceById);

export default router;