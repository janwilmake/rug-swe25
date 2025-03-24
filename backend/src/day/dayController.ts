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
        headers: headers,
      });
    } catch (error: any) {
      console.error("Error processing request:", error);
      return new Response("Internal Server Error: " + error.message, {
        status: 500,
      });
    }
  }
  
  /**
   * Handles the special case for the current day (endpoint: /day)
   * @param request The original request
   * @returns Response with the current day's data
   */
  async handleToday(request: Request): Promise<Response> {
    // Generate today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const day = today.getDate().toString().padStart(2, "0");
    const todayString = `${year}-${month}-${day}`;
    
    // Create a modified request with today's date
    const url = new URL(request.url);
    url.pathname = `/${todayString}`;
    
    // Create new request with the same parameters but different path
    const todayRequest = new Request(url.toString(), {
      method: 'GET',
      headers: request.headers
    });
    
    // Use the existing handler to process the request
    return this.handleRequest(todayRequest);
  }
}