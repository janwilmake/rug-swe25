import { Env } from "../types.js";
import { WeekService } from "./weekService.js";

export class WeekController {
  private weekService: WeekService;

  constructor(private env: Env) {
    this.weekService = new WeekService(env);
  }



  async handleLastWeek(request: Request): Promise<Response> {
    try {
      const data = await this.weekService.getLastWeekData();
      console.log(data);

      // Return response
      return new Response(JSON.stringify(data, undefined, 2), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error processing request:", error);
      return new Response("Internal Server Error: " + error.message, {
        status: 500,
      });
    }
  }
}