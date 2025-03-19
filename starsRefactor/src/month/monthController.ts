import { Env } from "../types.js";
import { MonthService } from "./monthService.js";

export class MonthController {
  private monthService: MonthService;

  constructor(private env: Env) {
    this.monthService = new MonthService(env);
  }


  async handleLastMonth(request: Request): Promise<Response> {
    try {
      const data = await this.monthService.getLastMonthData();
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