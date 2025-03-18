import { Env } from "./types.js";
import { DayController } from "./day/dayController.js";
import { WeekController } from "./week/weekController.js";
import { MonthController } from "./month/monthController.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    console.log(`[info] Requested path: ${path}`)

    // Day pattern: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(path)) {
      const dayController = new DayController(env);
      return dayController.handleRequest(request);
    }

    // Week pattern: YYYY-WXX (where XX is 1-52)
    if (/^\d{4}-W(0?[1-9]|[1-4][0-9]|5[0-2])$/.test(path)) {
      return new Response("api not implemented yet", { status: 501 });
    }

    // Month pattern: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(path)) {
      const monthController = new MonthController(env);
      return new Response("api not implemented yet", { status: 501 });
    }

    if (path === "day") {
       const dayController = new DayController(env);
        // Create a new URL object for the current date
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
        const day = today.getDate().toString().padStart(2, "0");
        const todayPath = `${year}-${month}-${day}`;
        // Use the same URL as the original request but change the path
        const todayUrl = new URL(url.origin);
        todayUrl.pathname = `/${todayPath}`
        
        // Create a new Request object using the new URL
        const todayRequest = new Request(todayUrl.toString(), {
          method: 'GET', // Assuming you're using GET
          headers: request.headers // you may need to add more headers depending on the use case
        });
      
        return dayController.handleRequest(todayRequest);

    }

    // Special endpoint for last 30 days
    if (path === "month") {
      const monthController = new MonthController(env);
      return monthController.handleLastMonth(request);
    }

    // Special endpoint for last 7 days
    if (path === "week") {
      const weekController = new WeekController(env);
      return weekController.handleLastWeek(request);
    }

    // Default response for unmatched routes
    return new Response(
      "Please fetch YYYY-MM-DD, YYYY-W1-52 (week), or YYYY-MM (month)",
      { status: 400 }
    );
  },
};
