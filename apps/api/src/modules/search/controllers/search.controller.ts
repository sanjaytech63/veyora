import { Request, Response, NextFunction } from "express";
import { searchService } from "../services/search.service";
import { SearchQueryInput, SearchSuggestionQueryInput } from "@veyora/validators";

export class SearchController {
  /**
   * Search active catalog with relevance ranking, faceted filters, and pagination
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as SearchQueryInput;
      const result = await searchService.search(query);

      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
        facets: result.facets,
        query: result.query,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search suggestions and autocomplete
   */
  async getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as SearchSuggestionQueryInput;
      const limit = query.limit ? Number(query.limit) : 5;
      const result = await searchService.getSuggestions(query.q, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
