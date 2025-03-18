import { Env } from "../types.js";
import { DayService } from "./dayService.js";

export class DayController {
  private dayService: DayService;

  constructor(private env: Env) {
    this.dayService = new DayService(env);
  }

  async handleRequest(request: Request): Promise<Response> {
    // Only handle GET requests
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get("limit");
    const dateParam = url.pathname.slice(1); // Remove leading slash

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return new Response("Invalid date format. Use YYYY-MM-DD", {
        status: 400,
      });
    }
    
    // Add CORS headers to allow cross-origin requests
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    

    try {
      // Get data from service
      const data = await this.dayService.getDailyStars(dateParam, limit ? parseInt(limit) : undefined);
      
      // Return response with CORS headers
      
      return new Response(JSON.stringify(data, undefined, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        },
      });
    } catch (error: any) {
      console.error("Error processing request:", error);
      return new Response("Internal Server Error: " + error.message, {
        status: 500,
      });
    }
  }
}