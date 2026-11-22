import { Router } from "express";
import { searchController } from "./controllers/search.controller";
import { validate } from "../../middleware/validate-request";
import { searchQuerySchema, searchSuggestionQuerySchema } from "@veyora/validators";

const router = Router();

// Full catalog search with relevance, facets, filters, and pagination
router.get(
  "/",
  validate({ query: searchQuerySchema }),
  searchController.search.bind(searchController)
);

// Autocomplete and search suggestions
router.get(
  "/suggestions",
  validate({ query: searchSuggestionQuerySchema }),
  searchController.getSuggestions.bind(searchController)
);

export { router as searchRouter };
